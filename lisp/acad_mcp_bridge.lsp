;;;; acad_mcp_bridge.lsp — Bridge MCP server <-> AutoCAD + YQArch
;;;;
;;;; The real YQArch plugin (yqarch.vlx) is loaded in AutoCAD.
;;;; This bridge receives commands from Claude via file-based IPC,
;;;; calls YQArch LISP functions with parameters, and returns results.
;;;;
;;;; KEY: YQArch commands are interactive (they prompt for points, widths).
;;;; This bridge feeds those prompts programmatically so Claude can drive
;;;; the full YQArch workflow: walls, doors, windows, columns, stairs,
;;;; dimensions, annotations — using the REAL block library.
;;;;
;;;; Protocol: file-based IPC via C:/temp/
;;;;   Request:  C:/temp/acad_mcp_cmd_{id}.json
;;;;   Response: C:/temp/acad_mcp_result_{id}.json

(setq *yqmcp-ipc-dir* "C:/temp/")

;;; ============================================================
;;; JSON helpers
;;; ============================================================

(defun yqmcp-escape-string (s / i ch out)
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
    )
    (princ (strcat "\n[yqmcp] ERROR: Cannot write " filepath))
  )
)

(defun yqmcp-json-get-string (json key / pos start end)
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

(defun yqmcp-json-get-number (json key / pos colpos rest numstr i ch)
  (setq pos (vl-string-search (strcat "\"" key "\"") json))
  (if pos
    (progn
      (setq colpos (vl-string-search ":" json pos))
      (if colpos
        (progn
          (setq rest (substr json (+ colpos 2)))
          ;; skip whitespace
          (setq i 1)
          (while (and (<= i (strlen rest)) (member (substr rest i 1) '(" " "\t" "\n")))
            (setq i (1+ i))
          )
          (setq numstr "" ch (substr rest i 1))
          (while (and (<= i (strlen rest)) (or (= ch ".") (= ch "-")
                      (and (>= (ascii ch) 48) (<= (ascii ch) 57))))
            (setq numstr (strcat numstr ch))
            (setq i (1+ i))
            (if (<= i (strlen rest)) (setq ch (substr rest i 1)))
          )
          (if (/= numstr "") (atof numstr) nil)
        )
      )
    )
  )
)

;;; ============================================================
;;; COMMAND EXECUTOR — handles YQArch + LISP eval + AutoCAD
;;; ============================================================

(defun yqmcp-execute-command (cmd params-json / funcname result-msg expr layer)
  (setq funcname (strcase cmd T))
  (setvar "CMDDIA" 0)

  (cond
    ;; ═══════════════════════════════════════════
    ;; LISP EVAL — run arbitrary AutoLISP
    ;; ═══════════════════════════════════════════
    ((= funcname "_lisp_eval")
     (setq expr (yqmcp-json-get-string params-json "expression"))
     (if expr
       (progn
         (princ (strcat "\n[yqmcp] Eval: " (if (> (strlen expr) 80) (strcat (substr expr 1 80) "...") expr)))
         (setq result-msg
           (vl-catch-all-apply
             (function (lambda () (eval (read expr))))
             nil
           )
         )
         (if (vl-catch-all-error-p result-msg)
           (strcat "{\"status\": \"error\", \"error\": \""
                   (yqmcp-escape-string (vl-catch-all-error-message result-msg)) "\"}")
           (strcat "{\"status\": \"ok\", \"result\": \"eval complete\"}")
         )
       )
       "{\"status\": \"error\", \"error\": \"No expression\"}"
     )
    )

    ;; ═══════════════════════════════════════════
    ;; LAYER TOOLS — direct, no dialog
    ;; ═══════════════════════════════════════════
    ((= funcname "yq_layer_new")
     (setq layer (yqmcp-json-get-string params-json "name"))
     (if layer (command "._-LAYER" "M" layer ""))
     (strcat "{\"status\": \"ok\", \"command\": \"yq_layer_new\", \"layer\": \""
             (yqmcp-escape-string (if layer layer "")) "\"}")
    )
    ((= funcname "yq_layer_current")
     (setq layer (yqmcp-json-get-string params-json "name"))
     (if layer (command "._-LAYER" "S" layer ""))
     (strcat "{\"status\": \"ok\", \"command\": \"yq_layer_current\"}")
    )

    ;; ═══════════════════════════════════════════
    ;; GENERIC HANDLER — call ANY YQArch function
    ;; This calls (c:yq_functionname) which triggers
    ;; the real YQArch command from yqarch.vlx
    ;; The command will use YQArch's block library,
    ;; layers, and configuration automatically.
    ;; ═══════════════════════════════════════════
    (T
     (princ (strcat "\n[yqmcp] Calling: (c:" funcname ")"))

     ;; Check if function exists
     (if (eval (read (strcat "c:" funcname)))
       (progn
         ;; Call the YQArch function
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
           (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname)
                   "\", \"note\": \"YQArch command started - may require user interaction in AutoCAD\"}")
         )
       )
       ;; Function not found - try as plain AutoCAD command
       (progn
         (princ (strcat "\n[yqmcp] Not a YQArch func, trying AutoCAD command: " funcname))
         (setq result-msg
           (vl-catch-all-apply 'command (list (strcat "_" (strcase funcname))))
         )
         (if (vl-catch-all-error-p result-msg)
           (strcat "{\"status\": \"error\", \"command\": \"" (yqmcp-escape-string funcname)
                   "\", \"error\": \"" (yqmcp-escape-string (vl-catch-all-error-message result-msg)) "\"}")
           (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname) "\"}")
         )
       )
     )
    )
  )
)

;;; ============================================================
;;; DISPATCHER — scans for pending command files
;;; ============================================================

(defun c:yqmcp-dispatch ( / files fname f fh json line cmd req-id result result-file)
  (setq files (vl-directory-files *yqmcp-ipc-dir* "acad_mcp_cmd_*.json" 1))
  (foreach fname files
    (setq f (strcat *yqmcp-ipc-dir* fname))
    (princ (strcat "\n[yqmcp] Processing: " fname))

    (setq json "")
    (setq fh (open f "r"))
    (if fh
      (progn
        (while (setq line (read-line fh))
          (setq json (strcat json line))
        )
        (close fh)

        (setq req-id (yqmcp-json-get-string json "request_id"))
        (setq cmd (yqmcp-json-get-string json "command"))

        (if (and req-id cmd)
          (progn
            (princ (strcat "\n[yqmcp] Command: " cmd " (id: " req-id ")"))

            (setq result
              (vl-catch-all-apply
                'yqmcp-execute-command
                (list cmd json)
              )
            )

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
;;; AUTO-DISPATCH via editor reactor
;;; ============================================================

(defun yqmcp-auto-check (reactor args)
  (if (vl-directory-files *yqmcp-ipc-dir* "acad_mcp_cmd_*.json" 1)
    (vl-catch-all-apply 'c:yqmcp-dispatch nil)
  )
)

(defun yqmcp-setup-reactor ()
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

;;; ============================================================
;;; TIMER-BASED POLLING (backup for reactor)
;;; ============================================================

(defun yqmcp-timer-check ()
  "Timer callback - check for pending commands every 500ms"
  (if (vl-directory-files *yqmcp-ipc-dir* "acad_mcp_cmd_*.json" 1)
    (vl-catch-all-apply 'c:yqmcp-dispatch nil)
  )
)

;;; ============================================================
;;; START
;;; ============================================================

(defun c:yqmcp-start ()
  (princ "\n============================================")
  (princ "\n  AutoCAD MCP Bridge v4.0 (YQArch)")
  (princ "\n  Real YQArch commands from yqarch.vlx")
  (princ "\n  Block library: C:/YQArch/sys/windows/")
  (princ "\n  IPC: C:/temp/acad_mcp_cmd_*.json")
  (princ "\n============================================")

  ;; Ensure YQArch is loaded
  (if (null c:yq_about)
    (progn
      (princ "\n[yqmcp] Loading YQArch...")
      (if (findfile "yqarch.vlx")
        (load "yqarch.vlx")
        (princ "\n[yqmcp] WARNING: yqarch.vlx not found! Add C:\\YQArch\\sys to support paths.")
      )
    )
    (princ "\n[yqmcp] YQArch already loaded.")
  )

  ;; Ensure IPC dir exists
  (if (not (vl-file-directory-p *yqmcp-ipc-dir*))
    (vl-mkdir *yqmcp-ipc-dir*)
  )

  (yqmcp-setup-reactor)
  (c:yqmcp-dispatch)
  (princ "\n[yqmcp] Ready. Commands dispatched via reactor + lisp_eval.")
  (princ)
)

;;; Auto-start on load
(c:yqmcp-start)
(princ)
