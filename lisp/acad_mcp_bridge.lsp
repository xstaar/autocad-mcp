;;;; acad_mcp_bridge.lsp — Generic bridge between autocad-mcp (Node.js) and AutoCAD
;;;;
;;;; This bridge dispatches architectural commands received from the MCP server.
;;;; It reads command files from C:/temp/, executes the command, and writes the result.
;;;;
;;;; Protocol:
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

(defun yqmcp-write-result (filepath request_id ok payload_json / f tmp)
  "Write a result JSON file atomically (via .tmp rename)."
  (setq tmp (strcat filepath ".tmp"))
  (setq f (open tmp "w"))
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
      (if (findfile filepath) (vl-file-delete filepath))
      (vl-file-rename tmp filepath)
    )
    (princ (strcat "\n[yqmcp] ERROR: Cannot write " tmp))
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
;;; Generic command execution
;;; ============================================================

(defun yqmcp-execute-command (cmd params-json / layer thickness pts pt1 w h)
  "Execute any YQ command. Uses params from JSON to feed command-line prompts.
   Returns a JSON payload string describing the result."

  ;; Extract common parameters
  (setq layer (yqmcp-json-get-string params-json "layer"))
  (setq thickness (yqmcp-json-get-number params-json "thickness"))
  (setq w (yqmcp-json-get-number params-json "width"))
  (setq h (yqmcp-json-get-number params-json "height"))
  (setq pts (yqmcp-parse-points (yqmcp-json-get-array params-json "points")))

  ;; Set layer if specified
  (if (and layer (/= layer "null") (/= layer ""))
    (progn
      (command "._-LAYER" "M" layer "")
    )
  )

  ;; Handle specific commands that need parameter feeding
  (cond
    ;; ── WALL commands: need thickness + points ──
    ((member cmd '("YQ_WALL" "YQ_SIMPLE_WALL" "YQ_PARTITIONWALL" "YQ_DOUBLELINE"))
     (command (strcat "._" cmd))
     (if thickness (command thickness))
     (foreach pt pts (command (list (car pt) (cadr pt))))
     (command "")
    )

    ;; ── COLUMN commands: need width + height + insertion point ──
    ((member cmd '("YQ_R_COLUMN" "YQ_C_COLUMN" "YQ_L_COLUMN" "YQ_T_COLUMN" "YQ_O_COLUMN"))
     (setq pt1 (yqmcp-parse-points (strcat "[" (yqmcp-json-get-array params-json "insertion_point") "]")))
     (command (strcat "._" cmd))
     (if w (command w))
     (if h (command h))
     (if pt1 (command (list (car (car pt1)) (cadr (car pt1)))))
     (command "")
    )

    ;; ── DOOR/WINDOW commands: need width + insertion point ──
    ((member cmd '("YQ_DOOR" "YQ_WINDOW" "YQ_WINDOWDOOR" "YQ_POCKETDOOR"
                   "YQ_HOLE_DOOR" "YQ_HOLE_WIN" "YQ_HOLE_WINDOW"))
     (setq pt1 (yqmcp-parse-points (strcat "[" (yqmcp-json-get-array params-json "insertion_point") "]")))
     (command (strcat "._" cmd))
     (if w (command w))
     (if pt1 (command (list (car (car pt1)) (cadr (car pt1)))))
     (command "")
    )

    ;; ── STAIRCASE commands ──
    ((member cmd '("YQ_STAIRCASE_PLAN" "YQ_STAIRCASE_SECTION" "YQ_ARCSTAIR_PLAN"))
     (setq pt1 (yqmcp-parse-points (strcat "[" (yqmcp-json-get-array params-json "start_point") "]")))
     (command (strcat "._" cmd))
     (if pt1 (command (list (car (car pt1)) (cadr (car pt1)))))
     (command "")
    )

    ;; ── GRIDAXIS: needs origin + spacings ──
    ((= cmd "YQ_GRIDAXIS")
     (setq pt1 (yqmcp-parse-points (strcat "[" (yqmcp-json-get-array params-json "origin") "]")))
     (command "._YQ_GRIDAXIS")
     (if pt1 (command (list (car (car pt1)) (cadr (car pt1)))))
     ;; Feed spacings
     (foreach sp (yqmcp-parse-flat-array (yqmcp-json-get-array params-json "x_spacings"))
       (command sp)
     )
     (command "")
     (foreach sp (yqmcp-parse-flat-array (yqmcp-json-get-array params-json "y_spacings"))
       (command sp)
     )
     (command "")
    )

    ;; ── DIM_AUTO: auto dimensioning ──
    ((= cmd "YQ_DIM_AUTO")
     (command "._YQ_DIM_AUTO")
     (command "")
    )

    ;; ── TEXT: insert text ──
    ((= cmd "YQ_TEXT")
     (setq pt1 (yqmcp-parse-points (strcat "[" (yqmcp-json-get-array params-json "insertion_point") "]")))
     (command "._YQ_TEXT")
     (if pt1 (command (list (car (car pt1)) (cadr (car pt1)))))
     (if h (command h))
     (command (yqmcp-json-get-string params-json "text"))
     (command "")
    )

    ;; ── LAYER commands ──
    ((= cmd "YQ_LAYER_NEW")
     (command "._-LAYER" "M" (yqmcp-json-get-string params-json "name") "")
    )
    ((= cmd "YQ_LAYER_CURRENT")
     (command "._-LAYER" "S" (yqmcp-json-get-string params-json "name") "")
    )
    ((member cmd '("YQ_LAYER_OFF" "YQ_LAYER_ON" "YQ_LAYER_FREEZE" "YQ_LAYER_THAW"
                   "YQ_LAYER_LOCK" "YQ_LAYER_UNLOCK"))
     (command (strcat "._" cmd))
     (command "")
    )
    ((= cmd "YQ_LAYER_SHOWALL")
     (command "._YQ_LAYER_SHOWALL")
    )

    ;; ── HATCH ──
    ((= cmd "YQ_HATCH_QUICK")
     (command "._YQ_HATCH_QUICK")
     (command "")
    )

    ;; ── GENERIC FALLBACK: just invoke the command by name ──
    (T
     (princ (strcat "\n[yqmcp] Generic dispatch: " cmd))
     (command (strcat "._" cmd))
     ;; Feed points if available
     (foreach pt pts (command (list (car pt) (cadr pt))))
     ;; Try to end the command
     (command "")
    )
  )

  ;; Return a success payload
  (strcat "{\"status\": \"ok\", \"command\": \"" (yqmcp-escape-string cmd) "\"}")
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
;;; Startup / help
;;; ============================================================

(defun c:yqmcp-start ()
  "Start message for the AutoCAD MCP bridge."
  (princ "\n╔══════════════════════════════════════════╗")
  (princ "\n║   AutoCAD MCP Bridge v2.0               ║")
  (princ "\n║   IPC: C:/temp/acad_mcp_cmd_*.json      ║")
  (princ "\n║   684 commands available                 ║")
  (princ "\n╚══════════════════════════════════════════╝")
  (princ "\n[acad-mcp] Run YQMCP-DISPATCH to process pending commands.")
  (princ "\n[acad-mcp] Or set up a timer reactor for auto-dispatch.")
  (princ)
)

;;; Load message
(princ "\n[acad-mcp] AutoCAD MCP Bridge v2.0 loaded. Type YQMCP-START to begin.")
(princ)
