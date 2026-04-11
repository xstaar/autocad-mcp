;;;; acad_mcp_bridge.lsp — Bridge between MCP server and AutoCAD + YQArch
;;;;
;;;; Dispatches commands from MCP → calls real YQArch LISP functions.
;;;; Supports ALL 465 YQArch commands via generic handler.
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

;;; ============================================================
;;; Generic YQArch function caller — handles ALL 465 commands
;;; ============================================================

(defun yqmcp-execute-command (cmd params-json / funcname layer result-msg)
  "Execute a command received from MCP. cmd = YQArch function name.
   Calls (c:funcname) directly — works for ALL YQArch commands.
   Returns a JSON payload string."

  ;; Normalize to lowercase
  (setq funcname (strcase cmd T))

  ;; Set layer if specified in params
  (setq layer (yqmcp-json-get-string params-json "layer"))
  (if (and layer (/= layer "null") (/= layer ""))
    (progn
      (princ (strcat "\n[yqmcp] Setting layer: " layer))
      (command "._-LAYER" "M" layer "")
    )
  )

  ;; Suppress dialogs where possible
  (setvar "CMDDIA" 0)

  ;; Special handling for standard AutoCAD layer commands (not YQArch)
  (cond
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

    ;; ── GENERIC HANDLER: call any YQArch function by name ──
    (T
     (princ (strcat "\n[yqmcp] Calling: (c:" funcname ")"))
     (setq result-msg
       (vl-catch-all-apply
         (function (lambda ()
           (eval (list (read (strcat "c:" funcname))))
         ))
         nil
       )
     )
     (if (vl-catch-all-error-p result-msg)
       ;; Function call failed — try as AutoCAD command fallback
       (progn
         (princ (strcat "\n[yqmcp] Function not found, trying command: " funcname))
         (setq result-msg
           (vl-catch-all-apply 'command (list (strcat "_" (strcase funcname))))
         )
         (if (vl-catch-all-error-p result-msg)
           (strcat "{\"status\": \"error\", \"command\": \"" (yqmcp-escape-string funcname)
                   "\", \"error\": \"" (yqmcp-escape-string (vl-catch-all-error-message result-msg)) "\"}")
           (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname) "\"}")
         )
       )
       ;; Success
       (strcat "{\"status\": \"launched\", \"command\": \"" (yqmcp-escape-string funcname) "\"}")
     )
    )
  )
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
  (princ "\n  AutoCAD MCP Bridge v3.1 (YQArch)")
  (princ "\n  465 commands — all YQArch functions")
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
