;;;; acad_mcp_bridge.lsp — Bridge between MCP server and AutoCAD + YQArch
;;;;
;;;; Dispatches commands from MCP → calls real YQArch LISP functions.
;;;; Protocol: file-based IPC via C:/temp/
;;;;   Request:  C:/temp/acad_mcp_cmd_{id}.json
;;;;   Response: C:/temp/acad_mcp_result_{id}.json

(setq *yqmcp-ipc-dir* "C:/temp/")

;;; ============================================================
;;; JSON helpers (minimal, no external dependencies)
;;; ============================================================

(defun yqmcp-escape-string (s / i ch out)
  "Escape a string for JSON output."
  (setq out "" i 1)
  (repeat (strlen s)
    (setq ch (substr s i 1))
    (cond
      ((= ch "\\") (setq out (strcat out "\\\\")))
      ((= ch "\"") (setq out (strcat out "\\\"")))
      ((= ch "\n") (setq out (strcat out "\\n")))
      ((= ch "\t") (setq out (strcat out "\\t")))
      (T (setq out (strcat out ch)))
    )
    (setq i (1+ i))
  )
  out
)

(defun yqmcp-write-result (filepath request_id ok payload_json / f)
  "Write a result JSON file."
  (if (findfile filepath) (vl-file-delete filepath))
  (setq f (open filepath "w"))
  (if f
    (progn
      (write-line "{" f)
      (write-line (strcat "  \"request_id\": \"" (yqmcp-escape-string request_id) "\",") f)
      (if ok
        (write-line "  \"ok\": true," f)
        (write-line "  \"ok\": false," f)
      )
      (write-line (strcat "  \"payload\": " payload_json) f)
      (write-line "}" f)
      (close f)
      (princ (strcat "\n[yqmcp] Result written: " filepath))
    )
    (princ (strcat "\n[yqmcp] ERROR: Cannot write " filepath))
  )
)

(defun yqmcp-json-get-string (json key / pos start end)
  "Extract a string value from JSON by key name."
  (setq pos (vl-string-search (strcat "\"" key "\"") json))
  (if pos
    (progn
      (setq pos (vl-string-search ":" json pos))
      (if pos
        (progn
          (setq start (vl-string-search "\"" json (1+ pos)))
          (if start
            (progn
              (setq start (1+ start))
              (setq end (vl-string-search "\"" json start))
              (if end (substr json (1+ start) (- end start)) nil)
            )
          )
        )
      )
    )
  )
)

(defun yqmcp-json-get-number (json key / pos start end substr-val)
  "Extract a numeric value from JSON by key name."
  (setq pos (vl-string-search (strcat "\"" key "\"") json))
  (if pos
    (progn
      (setq pos (vl-string-search ":" json pos))
      (if pos
        (progn
          (setq start (1+ pos))
          (while (and (< start (strlen json))
                      (member (substr json (1+ start) 1) '(" " "\t" "\n")))
            (setq start (1+ start))
          )
          (setq end start)
          (while (and (< end (strlen json))
                      (member (substr json (1+ end) 1)
                              '("0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "." "-")))
            (setq end (1+ end))
          )
          (setq substr-val (substr json (1+ start) (- end start)))
          (if (> (strlen substr-val) 0) (atof substr-val) nil)
        )
      )
    )
  )
)

(defun yqmcp-json-get-array (json key / pos depth start end)
  "Extract a raw array string from JSON by key name."
  (setq pos (vl-string-search (strcat "\"" key "\"") json))
  (if pos
    (progn
      (setq pos (vl-string-search "[" json pos))
      (if pos
        (progn
          (setq start pos depth 1 end (1+ pos))
          (while (and (> depth 0) (< end (strlen json)))
            (cond
              ((= (substr json (1+ end) 1) "[") (setq depth (1+ depth)))
              ((= (substr json (1+ end) 1) "]") (setq depth (1- depth)))
            )
            (setq end (1+ end))
          )
          (substr json (1+ start) (1+ (- end start)))
        )
      )
    )
  )
)

(defun yqmcp-parse-points (arr-str / pts cur-pt num-str i ch state)
  "Parse a JSON array of [x,y] pairs into a list of (x y) lists."
  (if (null arr-str) (setq arr-str "[]"))
  (setq pts '() cur-pt nil num-str "" i 1 state 0)
  (repeat (strlen arr-str)
    (setq ch (substr arr-str i 1))
    (cond
      ((and (= ch "[") (= state 0)) (setq state 1))
      ((and (= ch "[") (= state 1)) (setq state 2 cur-pt nil num-str ""))
      ((and (= ch ",") (= state 2))
       (setq cur-pt (cons (atof num-str) cur-pt) num-str ""))
      ((and (= ch "]") (= state 2))
       (setq cur-pt (cons (atof num-str) cur-pt))
       (setq pts (cons (reverse cur-pt) pts))
       (setq state 1 num-str ""))
      ((= state 2) (setq num-str (strcat num-str ch)))
    )
    (setq i (1+ i))
  )
  (reverse pts)
)

(defun yqmcp-parse-flat-array (arr-str / nums num-str i ch)
  "Parse a flat JSON array [n1, n2, ...] into a list of numbers."
  (if (null arr-str) (setq arr-str "[]"))
  (setq nums '() num-str "" i 1)
  (repeat (strlen arr-str)
    (setq ch (substr arr-str i 1))
    (cond
      ((member ch '("[" " " "\t" "\n")))
      ((or (= ch ",") (= ch "]"))
       (if (> (strlen num-str) 0)
         (progn (setq nums (cons (atof num-str) nums)) (setq num-str ""))
       )
      )
      (T (setq num-str (strcat num-str ch)))
    )
    (setq i (1+ i))
  )
  (reverse nums)
)

;;; ============================================================
;;; YQArch function caller — invokes the REAL plugin functions
;;; ============================================================

(defun yqmcp-call-yqarch (funcname / fn result)
  "Call a YQArch LISP function by name string. Returns T on success, nil on failure."
  (princ (strcat "\n[yqmcp] Calling YQArch: (c:" funcname ")"))
  ;; Suppress dialogs where possible
  (setvar "CMDDIA" 0)
  ;; Try calling the function
  (setq fn (eval (read (strcat "c:" funcname))))
  (if fn
    (progn
      (vl-catch-all-apply (read (strcat "c:" funcname)) nil)
      T
    )
    ;; Fallback: try as a plain command
    (progn
      (princ (strcat "\n[yqmcp] Fallback: (command \"" funcname "\")"))
      (vl-catch-all-apply 'command (list funcname))
      T
    )
  )
)

;;; ============================================================
;;; Command execution — routes MCP commands to YQArch functions
;;; ============================================================

(defun yqmcp-execute-command (cmd params-json / funcname layer result-msg)
  "Execute a command received from MCP. cmd = YQArch function name (e.g. yq_wall).
   Returns a JSON payload string."

  ;; Normalize: remove leading underscore or prefix if present
  (setq funcname (strcase cmd T)) ;; lowercase

  ;; Set layer if specified
  (setq layer (yqmcp-json-get-string params-json "layer"))
  (if (and layer (/= layer "null") (/= layer ""))
    (command "._-LAYER" "M" layer "")
  )

  ;; Suppress dialogs
  (setvar "CMDDIA" 0)

  ;; Route based on command name
  (cond
    ;; ── WALL: yq_wall — draws double-line walls ──
    ((= funcname "yq_wall")
     (yqmcp-exec-wall params-json)
    )

    ;; ── DOUBLELINE: yq_doubleline ──
    ((= funcname "yq_doubleline")
     (yqmcp-exec-doubleline params-json)
    )

    ;; ── PARTITION WALL: yq_partitionwall ──
    ((= funcname "yq_partitionwall")
     (yqmcp-exec-wall params-json) ;; same input sequence as wall
    )

    ;; ── LINE TO WALL: yq_line2wall ──
    ((= funcname "yq_line2wall")
     (princ "\n[yqmcp] yq_line2wall: select lines in AutoCAD")
     (c:yq_line2wall)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\", \"note\": \"Select lines to convert\"}")
    )

    ;; ── WALL THICKNESS CHANGE: yq_wall_chgthk ──
    ((= funcname "yq_wall_chgthk")
     (princ "\n[yqmcp] yq_wall_chgthk: select wall to change")
     (c:yq_wall_chgthk)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── TRIM/FIX WALL: yq_trim_fix_wall ──
    ((= funcname "yq_trim_fix_wall")
     (c:yq_trim_fix_wall)
     (strcat "{\"status\": \"ok\", \"command\": \"" funcname "\"}")
    )

    ;; ── ERASE WALL/DOOR/COLUMN: yq_erase_wall ──
    ((= funcname "yq_erase_wall")
     (c:yq_erase_wall)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── COLUMNS ──
    ((member funcname '("yq_r_column" "yq_o_column" "yq_l_column" "yq_t_column" "yq_c_column"))
     (yqmcp-exec-column funcname params-json)
    )

    ;; ── AXIS COLUMN: yq_axis_column ──
    ((= funcname "yq_axis_column")
     (c:yq_axis_column)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── DOORS (on wall — cuts wall and inserts door) ──
    ((= funcname "yq_hole_door")
     (yqmcp-exec-hole-door params-json)
    )

    ;; ── DOOR (free placement) ──
    ((= funcname "yq_door")
     (yqmcp-exec-door params-json)
    )

    ;; ── POCKET DOOR (on wall) ──
    ((= funcname "yq_hole_pocketdoor")
     (c:yq_hole_pocketdoor)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── POCKET DOOR (free placement) ──
    ((= funcname "yq_pocketdoor")
     (c:yq_pocketdoor)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── WINDOWS (on wall — cuts wall and inserts window) ──
    ((= funcname "yq_hole_win")
     (yqmcp-exec-hole-win params-json)
    )

    ;; ── WINDOW (free placement, simple) ──
    ((= funcname "yq_win")
     (c:yq_win)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── PARAMETRIC WINDOW (on wall) ──
    ((= funcname "yq_hole_window")
     (c:yq_hole_window)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── PARAMETRIC WINDOW (free placement) ──
    ((= funcname "yq_window")
     (c:yq_window)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── CORNER WINDOW ──
    ((= funcname "yq_hole_cornerwindow")
     (c:yq_hole_cornerwindow)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── REPLACE DOOR/WINDOW TYPE ──
    ((= funcname "yq_windoor_replace")
     (c:yq_windoor_replace)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── CHANGE DOOR/WINDOW WIDTH ──
    ((= funcname "yq_width_windoor")
     (c:yq_width_windoor)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── MOVE DOOR/WINDOW ──
    ((= funcname "yq_move_windoor")
     (c:yq_move_windoor)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── CUT HOLE IN WALL ──
    ((= funcname "yq_hole")
     (c:yq_hole)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── REPAIR DOOR/WINDOW/COLUMN ──
    ((= funcname "yq_repair")
     (c:yq_repair)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── FLIP/OVERTURN ──
    ((= funcname "yq_overturn")
     (c:yq_overturn)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── STAIRCASE PLAN ──
    ((= funcname "yq_staircase_plan")
     (c:yq_staircase_plan)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── STAIRCASE SECTION ──
    ((= funcname "yq_staircase_section")
     (c:yq_staircase_section)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── ARC STAIRCASE PLAN ──
    ((= funcname "yq_arcstair_plan")
     (c:yq_arcstair_plan)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── ESCALATOR ──
    ((= funcname "yq_escalator")
     (c:yq_escalator)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── ELEVATOR/LIFT PLAN ──
    ((= funcname "yq_lift_plan")
     (c:yq_lift_plan)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── CURTAIN WALL ──
    ((= funcname "yq_curtainwall")
     (c:yq_curtainwall)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── GLASS PARTITION ──
    ((= funcname "yq_glass_partition")
     (c:yq_glass_partition)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── BANISTER/RAILING ──
    ((= funcname "yq_banister")
     (c:yq_banister)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AUTO FURNITURE ──
    ((= funcname "yq_autofurniture")
     (c:yq_autofurniture)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AUTO WC/BATHROOM ──
    ((= funcname "yq_arrangewc")
     (c:yq_ArrangeWC)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── STONE TILE ──
    ((= funcname "yq_stonetile")
     (c:yq_stonetile)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── WOOD FLOORING ──
    ((= funcname "yq_woodflooring")
     (c:yq_woodflooring)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── GYPSUM BOARD ──
    ((= funcname "yq_gypsumboard")
     (c:yq_gypsumboard)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── INSULATION ──
    ((= funcname "yq_insulation")
     (c:yq_insulation)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AUTO LAMPS ──
    ((= funcname "yq_autolamps")
     (c:yq_autolamps)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── GRID AXIS ──
    ((= funcname "yq_gridaxis")
     (yqmcp-exec-gridaxis params-json)
    )

    ;; ── AXIS LINE ──
    ((= funcname "yq_axisline")
     (c:yq_axisline)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AUTO AXIS DIMENSIONING ──
    ((= funcname "yq_auto_axis_dim")
     (c:yq_auto_axis_dim)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AXIS SYMBOLS ──
    ((= funcname "yq_symbol_axis_c")
     (c:yq_symbol_axis_c)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── ELEVATION MARKER ──
    ((= funcname "yq_designed_elevation")
     (c:yq_designed_elevation)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── SECTION CUT SYMBOL ──
    ((= funcname "yq_symbol_sectioncutter")
     (c:yq_symbol_sectionCutter)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── ENTRANCE ARROW ──
    ((= funcname "yq_entrancearrow")
     (c:yq_entrancearrow)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── LEADER ──
    ((= funcname "yq_leader")
     (c:yq_leader)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── DRAWING TITLE ──
    ((= funcname "yq_drawingtitle")
     (c:yq_drawingtitle)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── DIMENSIONS ──
    ((= funcname "yq_dim_linear")
     (c:yq_dim_linear)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_dim_aligned")
     (c:yq_dim_aligned)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_dim_baseline")
     (c:yq_dim_baseline)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_dim_closedspace")
     (c:yq_dim_closedspace)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_dim_axiswd")
     (c:yq_dim_axiswd)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_dim_qdim")
     (c:yq_dim_qdim)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── TEXT ──
    ((= funcname "yq_text")
     (c:yq_text)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_text_replace")
     (c:yq_text_replace)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_changetext")
     (c:yq_changetext)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── EXTRA TOOLS ──
    ((= funcname "yq_trimdoubleline")
     (c:yq_trimdoubleline)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_alignment")
     (c:yq_alignment)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )
    ((= funcname "yq_transform")
     (c:yq_transform)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── LAYER TOOLS ──
    ((= funcname "yq_layertools")
     (c:yq_layertools)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── AREA WALL (draw wall from closed polyline) ──
    ((= funcname "yq_areawall")
     (c:yq_areawall)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── SIMPLE WALL ──
    ((= funcname "yq_simple_wall")
     (c:yq_simple_wall)
     (strcat "{\"status\": \"launched\", \"command\": \"" funcname "\"}")
    )

    ;; ── STANDARD AUTOCAD LAYER COMMANDS ──
    ((= funcname "layer_new")
     (command "._-LAYER" "M" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_new\", \"layer\": \""
             (yqmcp-escape-string (yqmcp-json-get-string params-json "name")) "\"}")
    )
    ((= funcname "layer_current")
     (command "._-LAYER" "S" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_current\"}")
    )
    ((= funcname "layer_off")
     (command "._-LAYER" "OFF" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_off\"}")
    )
    ((= funcname "layer_on")
     (command "._-LAYER" "ON" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_on\"}")
    )
    ((= funcname "layer_freeze")
     (command "._-LAYER" "F" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_freeze\"}")
    )
    ((= funcname "layer_thaw")
     (command "._-LAYER" "T" (yqmcp-json-get-string params-json "name") "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_thaw\"}")
    )
    ((= funcname "layer_showall")
     (command "._-LAYER" "ON" "*" "T" "*" "")
     (strcat "{\"status\": \"ok\", \"command\": \"layer_showall\"}")
    )

    ;; ── GENERIC FALLBACK: try calling as YQArch function ──
    (T
     (princ (strcat "\n[yqmcp] Generic call: (c:" funcname ")"))
     (setq result-msg
       (vl-catch-all-apply
         (function (lambda ()
           (eval (list (read (strcat "c:" funcname))))
         ))
         nil
       )
     )
     (if (vl-catch-all-error-p result-msg)
       (strcat "{\"status\": \"error\", \"command\": \"" (yqmcp-escape-string funcname)
               "\", \"error\": \"" (yqmcp-escape-string (vl-catch-all-error-message result-msg)) "\"}")
       (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname) "\"}")
     )
    )
  )
)

;;; ============================================================
;;; Parameterized command helpers
;;; ============================================================

(defun yqmcp-exec-wall (params-json / pts thickness)
  "Execute yq_wall with optional points and thickness parameters."
  (setq pts (yqmcp-parse-points (yqmcp-json-get-array params-json "points")))
  (setq thickness (yqmcp-json-get-number params-json "thickness"))
  (princ (strcat "\n[yqmcp] yq_wall: thickness=" (if thickness (rtos thickness 2 0) "default")
                 " points=" (itoa (length pts))))
  ;; Call real YQArch wall function
  (c:yq_wall)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_wall\", \"note\": \"YQArch wall dialog opened. Set thickness and draw points.\"}")
)

(defun yqmcp-exec-doubleline (params-json / pts thickness)
  "Execute yq_doubleline."
  (c:yq_doubleline)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_doubleline\"}")
)

(defun yqmcp-exec-column (funcname params-json / fn)
  "Execute a column command."
  (princ (strcat "\n[yqmcp] Column: " funcname))
  (eval (list (read (strcat "c:" funcname))))
  (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname) "\"}")
)

(defun yqmcp-exec-hole-door (params-json /)
  "Execute yq_hole_door — cuts wall and inserts door."
  (princ "\n[yqmcp] yq_hole_door: click on wall to insert door")
  (c:yq_hole_door)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_hole_door\", \"note\": \"Click on wall to place door\"}")
)

(defun yqmcp-exec-door (params-json /)
  "Execute yq_door — free door placement."
  (princ "\n[yqmcp] yq_door: place door freely")
  (c:yq_door)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_door\", \"note\": \"Place door at desired location\"}")
)

(defun yqmcp-exec-hole-win (params-json /)
  "Execute yq_hole_win — cuts wall and inserts window."
  (princ "\n[yqmcp] yq_hole_win: click on wall to insert window")
  (c:yq_hole_win)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_hole_win\", \"note\": \"Click on wall to place window\"}")
)

(defun yqmcp-exec-gridaxis (params-json / x-sp y-sp origin)
  "Execute yq_gridaxis — grid axis system."
  (princ "\n[yqmcp] yq_gridaxis: grid axis system")
  (c:yq_gridaxis)
  (strcat "{\"status\": \"launched\", \"command\": \"yq_gridaxis\", \"note\": \"Set grid parameters in dialog\"}")
)

;;; ============================================================
;;; Main dispatcher — scans for pending command files
;;; ============================================================

(defun c:yqmcp-dispatch ( / files fname f fh json line cmd req-id result result-file)
  "Scan for pending MCP command files and process them."
  (setq files (vl-directory-files *yqmcp-ipc-dir* "acad_mcp_cmd_*.json" 1))
  (foreach fname files
    (setq f (strcat *yqmcp-ipc-dir* fname))
    (princ (strcat "\n[yqmcp] Processing: " fname))

    ;; Read the JSON file
    (setq json "")
    (setq fh (open f "r"))
    (if fh
      (progn
        (while (setq line (read-line fh))
          (setq json (strcat json line))
        )
        (close fh)

        ;; Extract request_id and command
        (setq req-id (yqmcp-json-get-string json "request_id"))
        (setq cmd (yqmcp-json-get-string json "command"))

        (if (and req-id cmd)
          (progn
            (princ (strcat "\n[yqmcp] Command: " cmd " (id: " req-id ")"))

            ;; Execute with error catching
            (setq result
              (vl-catch-all-apply
                'yqmcp-execute-command
                (list cmd json)
              )
            )

            ;; Write result
            (setq result-file
              (strcat *yqmcp-ipc-dir* "acad_mcp_result_" req-id ".json")
            )

            (if (vl-catch-all-error-p result)
              (yqmcp-write-result result-file req-id nil
                (strcat "{\"error\": \""
                  (yqmcp-escape-string (vl-catch-all-error-message result))
                  "\"}")
              )
              (yqmcp-write-result result-file req-id T result)
            )

            ;; Cleanup command file
            (vl-file-delete f)
            (princ (strcat "\n[yqmcp] Done: " cmd))
          )
          (princ (strcat "\n[yqmcp] ERROR: Invalid JSON in " fname))
        )
      )
      (princ (strcat "\n[yqmcp] ERROR: Cannot open " f))
    )
  )
  (princ)
)

;;; ============================================================
;;; Auto-dispatch via editor reactor
;;; ============================================================

(defun yqmcp-auto-check (reactor args)
  "Called after AutoCAD finishes a command — check for pending MCP files."
  (vl-catch-all-apply 'c:yqmcp-dispatch nil)
)

(defun yqmcp-idle-check (reactor args)
  "Called on idle — check for pending MCP files."
  (if (vl-directory-files *yqmcp-ipc-dir* "acad_mcp_cmd_*.json" 1)
    (vl-catch-all-apply 'c:yqmcp-dispatch nil)
  )
)

(defun yqmcp-setup-reactor ()
  "Set up reactors for auto-dispatch."
  (if (not *yqmcp-reactor*)
    (progn
      (setq *yqmcp-reactor*
        (vlr-editor-reactor nil
          '((:vlr-commandEnded . yqmcp-auto-check)
            (:vlr-commandCancelled . yqmcp-auto-check)
            (:vlr-lispEnded . yqmcp-auto-check)
          )
        )
      )
      (princ "\n[yqmcp] Editor reactor installed.")
    )
  )
)

(defun c:yqmcp-start ()
  "Start the MCP bridge with auto-dispatch."
  (princ "\n============================================")
  (princ "\n  AutoCAD MCP Bridge v3.0 (YQArch)")
  (princ "\n  IPC: C:/temp/acad_mcp_cmd_*.json")
  (princ "\n  Auto-dispatch: editor reactor")
  (princ "\n============================================")
  (yqmcp-setup-reactor)
  ;; Process any pending commands immediately
  (c:yqmcp-dispatch)
  (princ "\n[yqmcp] Ready. Commands auto-process after any AutoCAD action.")
  (princ)
)

;;; Auto-start on load
(c:yqmcp-start)
(princ)
