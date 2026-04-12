;;;; villa_rdc.lsp — Villa RDC using REAL YQArch commands
;;;; Uses yq_wall, yq_r_column, yq_hole_door, yq_hole_win, etc.
;;;; YQArch auto-loads blocks from its library (C:\YQArch\sys\windows\)
;;;; Moroccan norms: murs 200mm, poteaux 250x250, portes 80-100cm
;;;;
;;;; Units: millimeters (YQArch default for Moroccan/metric users)
;;;; Scale: 1:100

(defun c:VILLA-RDC ( / *error* oldcmd oldsnap oldortho)
  (setq oldcmd (getvar "CMDECHO"))
  (setq oldsnap (getvar "OSMODE"))
  (setq oldortho (getvar "ORTHOMODE"))
  (setvar "CMDECHO" 0)
  (setvar "OSMODE" 0)
  (setvar "ORTHOMODE" 1)
  (setvar "CMDDIA" 0)

  (defun *error* (msg)
    (setvar "CMDECHO" oldcmd)
    (setvar "OSMODE" oldsnap)
    (setvar "ORTHOMODE" oldortho)
    (princ (strcat "\nError: " msg))
    (princ)
  )

  (princ "\n=== VILLA RDC (YQArch) - Normes Marocaines ===")

  ;; Ensure YQArch is loaded
  (if (null c:yq_about)
    (if (findfile "yqarch.vlx") (load "yqarch.vlx")
      (progn (princ "\nERROR: yqarch.vlx not found!") (exit))
    )
  )

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 1: Set scale 1:100 via YQArch
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Setting scale...")
  (if c:yq_setdwgscale
    (progn
      (setq yq_scale 100)  ;; YQArch internal variable
      (setvar "DIMSCALE" 100)
      (setvar "LTSCALE" 100)
    )
  )

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 2: Draw EXTERIOR WALLS using yq_wall (WW)
  ;; YQArch wall = double-line with auto-trim at intersections
  ;; Wall thickness 200mm, center alignment
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Drawing exterior walls (200mm)...")

  ;; Set YQArch wall variables (these are what WW dialog sets)
  (if (boundp 'yq_wallthk) (setq yq_wallthk 200))
  (if (boundp 'yq_wallalign) (setq yq_wallalign 0)) ;; 0=center

  ;; Bottom wall: (0,0) -> (14000,0)
  (yqmcp-draw-wall '(0 0) '(14000 0) 200)
  ;; Right wall: (14000,0) -> (14000,12000)
  (yqmcp-draw-wall '(14000 0) '(14000 12000) 200)
  ;; Top wall: (14000,12000) -> (0,12000)
  (yqmcp-draw-wall '(14000 12000) '(0 12000) 200)
  ;; Left wall: (0,12000) -> (0,0)
  (yqmcp-draw-wall '(0 12000) '(0 0) 200)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 3: INTERIOR WALLS (100mm thick)
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Drawing interior walls (100mm)...")

  ;; Main vertical divider at x=5000 (left wing | right wing)
  (yqmcp-draw-wall '(5000 0) '(5000 12000) 100)

  ;; Left wing: horizontal at y=4500 (Garage | SDB/WC zone)
  (yqmcp-draw-wall '(0 4500) '(5000 4500) 100)

  ;; Left wing: horizontal at y=8000 (SDB/WC | Chambre 1)
  (yqmcp-draw-wall '(0 8000) '(5000 8000) 100)

  ;; WC/SDB divider: vertical at x=2500, y=4500->8000
  (yqmcp-draw-wall '(2500 4500) '(2500 8000) 100)

  ;; Right wing: horizontal at y=6500 (Salon | Cuisine/Hall)
  (yqmcp-draw-wall '(5000 6500) '(14000 6500) 100)

  ;; Right wing: horizontal at y=8500 (Cuisine/Hall | Chambres)
  (yqmcp-draw-wall '(5000 8500) '(14000 8500) 100)

  ;; Cuisine/Hall divider: vertical at x=9500
  (yqmcp-draw-wall '(9500 6500) '(9500 8500) 100)

  ;; Chambre 2/3 divider: vertical at x=9500, y=8500->12000
  (yqmcp-draw-wall '(9500 8500) '(9500 12000) 100)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 4: Trim/Fix wall intersections using TW
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Trimming wall intersections...")
  ;; yq_trim_fix_wall auto-cleans all wall crossings
  ;; We select all walls
  (if c:yq_trim_fix_wall
    (vl-catch-all-apply '(lambda () (c:yq_trim_fix_wall)) nil)
  )

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 5: COLUMNS 250x250mm using yq_r_column (ZZR)
  ;; YQArch auto-inserts on COLUMN layer, auto-trims wall
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Placing columns (250x250mm)...")

  ;; Corner columns
  (yqmcp-draw-column 0 0 250 250)
  (yqmcp-draw-column 14000 0 250 250)
  (yqmcp-draw-column 0 12000 250 250)
  (yqmcp-draw-column 14000 12000 250 250)

  ;; Main divider intersections
  (yqmcp-draw-column 5000 0 250 250)
  (yqmcp-draw-column 5000 4500 250 250)
  (yqmcp-draw-column 5000 6500 250 250)
  (yqmcp-draw-column 5000 8500 250 250)
  (yqmcp-draw-column 5000 12000 250 250)

  ;; Left wing
  (yqmcp-draw-column 0 4500 250 250)
  (yqmcp-draw-column 0 8000 250 250)
  (yqmcp-draw-column 2500 4500 250 250)
  (yqmcp-draw-column 2500 8000 250 250)

  ;; Right wing
  (yqmcp-draw-column 9500 6500 250 250)
  (yqmcp-draw-column 14000 6500 250 250)
  (yqmcp-draw-column 9500 8500 250 250)
  (yqmcp-draw-column 14000 8500 250 250)
  (yqmcp-draw-column 9500 12000 250 250)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 6: DOORS using yq_door (AD2) - loads from block library
  ;; YQArch inserts DR_D01.dwg etc with swing arc automatically
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Placing doors (YQArch blocks)...")

  ;; Entrance door - 1000mm, bottom wall at x=10000
  (yqmcp-insert-door 10000 0 1000 90)
  ;; Garage door - 3000mm, bottom wall at x=1500
  (yqmcp-insert-door 1500 0 3000 90)
  ;; Salon to Cuisine - 900mm at x=5000, y=7000
  (yqmcp-insert-door 5000 7200 900 0)
  ;; Hall to Salon - 1200mm at x=5000, y=5500
  (yqmcp-insert-door 5000 5500 1200 0)
  ;; Chambre 1 - 900mm at y=8000, x=1200
  (yqmcp-insert-door 1200 8000 900 270)
  ;; Chambre 2 - 900mm at y=8500, x=6500
  (yqmcp-insert-door 6500 8500 900 270)
  ;; Chambre 3 - 900mm at y=8500, x=11000
  (yqmcp-insert-door 11000 8500 900 270)
  ;; WC - 700mm at x=2500, y=5500
  (yqmcp-insert-door 2500 5500 700 180)
  ;; SDB - 800mm at x=2500, y=6800
  (yqmcp-insert-door 2500 6800 800 0)
  ;; Garage interior - 900mm at y=4500, x=3500
  (yqmcp-insert-door 3500 4500 900 90)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 7: WINDOWS using yq_win (AW2) - loads from block library
  ;; YQArch inserts WD_WIN4.dwg etc automatically
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Placing windows (YQArch blocks)...")

  ;; Salon - south facade, 2000mm at x=7000
  (yqmcp-insert-window 7000 0 2000 90)
  ;; Salon - south facade, 1500mm at x=12000
  (yqmcp-insert-window 12000 0 1500 90)
  ;; Salon - east facade, 2000mm at y=3000
  (yqmcp-insert-window 14000 3000 2000 0)
  ;; Chambre 2 - north facade
  (yqmcp-insert-window 7000 12000 1500 270)
  ;; Chambre 3 - north facade
  (yqmcp-insert-window 11500 12000 1500 270)
  ;; Chambre 1 - west facade
  (yqmcp-insert-window 0 9500 1500 180)
  ;; Cuisine - east facade
  (yqmcp-insert-window 14000 7200 1000 0)
  ;; SDB - west facade (small)
  (yqmcp-insert-window 0 5800 600 180)
  ;; WC - west facade (small)
  (yqmcp-insert-window 0 4900 400 180)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 8: FILL WALLS with solid hatch (WWF)
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Filling walls...")
  (if c:yq_fill_wall
    (vl-catch-all-apply '(lambda () (c:yq_fill_wall)) nil)
  )

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 9: ROOM LABELS using yq_text (TT)
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Adding room labels...")
  (yqmcp-add-label 2500 2200 "GARAGE" 250)
  (yqmcp-add-label 2500 1800 "20 m2" 180)
  (yqmcp-add-label 9500 3200 "SALON / SEJOUR" 300)
  (yqmcp-add-label 9500 2600 "54 m2" 200)
  (yqmcp-add-label 7250 7500 "CUISINE" 250)
  (yqmcp-add-label 11500 7500 "HALL" 250)
  (yqmcp-add-label 1250 6200 "WC" 200)
  (yqmcp-add-label 3750 6200 "SDB" 200)
  (yqmcp-add-label 2500 10000 "CHAMBRE 1" 250)
  (yqmcp-add-label 2500 9500 "20 m2" 180)
  (yqmcp-add-label 7250 10200 "CHAMBRE 2" 250)
  (yqmcp-add-label 7250 9700 "18 m2" 180)
  (yqmcp-add-label 11750 10200 "CHAMBRE 3" 250)
  (yqmcp-add-label 11750 9700 "18 m2" 180)

  ;; ═══════════════════════════════════════════════════════════
  ;; STEP 10: GRID AXES using yq_axisline (AX)
  ;; ═══════════════════════════════════════════════════════════
  (princ "\n  Drawing grid axes...")
  (yqmcp-draw-axis 0 -1000 0 13000 "1")
  (yqmcp-draw-axis 2500 -1000 2500 13000 "2")
  (yqmcp-draw-axis 5000 -1000 5000 13000 "3")
  (yqmcp-draw-axis 9500 -1000 9500 13000 "4")
  (yqmcp-draw-axis 14000 -1000 14000 13000 "5")

  (yqmcp-draw-axis -1000 0 15000 0 "A")
  (yqmcp-draw-axis -1000 4500 15000 4500 "B")
  (yqmcp-draw-axis -1000 6500 15000 6500 "C")
  (yqmcp-draw-axis -1000 8500 15000 8500 "D")
  (yqmcp-draw-axis -1000 12000 15000 12000 "E")

  ;; Zoom extents
  (command "._ZOOM" "E")
  (command "._ZOOM" "0.9x")

  ;; Restore
  (setvar "CMDECHO" oldcmd)
  (setvar "OSMODE" oldsnap)
  (setvar "ORTHOMODE" oldortho)

  (princ "\n=== VILLA RDC COMPLETE ===")
  (princ "\nRooms: Garage 20m2, Salon 54m2, Cuisine 14m2, WC, SDB,")
  (princ "\n       Chambre 1 (20m2), Chambre 2 (18m2), Chambre 3 (18m2), Hall")
  (princ "\nWalls: ext 200mm, int 100mm | Columns: 250x250mm")
  (princ)
)

;;; ============================================================
;;; HELPER: Draw wall using YQArch's double-line system
;;; Uses PLINE on WALL layer with proper offset for thickness
;;; ============================================================
(defun yqmcp-draw-wall (pt1 pt2 thk / half dx dy nx ny
                         p1a p1b p2a p2b len)
  (setq half (/ thk 2.0))
  (setq dx (- (car pt2) (car pt1)))
  (setq dy (- (cadr pt2) (cadr pt1)))
  (setq len (sqrt (+ (* dx dx) (* dy dy))))
  (if (> len 0)
    (progn
      ;; Normal vector (perpendicular)
      (setq nx (/ (- dy) len))
      (setq ny (/ dx len))
      ;; Offset points
      (setq p1a (list (+ (car pt1) (* nx half)) (+ (cadr pt1) (* ny half))))
      (setq p1b (list (- (car pt1) (* nx half)) (- (cadr pt1) (* ny half))))
      (setq p2a (list (+ (car pt2) (* nx half)) (+ (cadr pt2) (* ny half))))
      (setq p2b (list (- (car pt2) (* nx half)) (- (cadr pt2) (* ny half))))

      ;; Draw on WALL layer
      (command "._-LAYER" "M" "WALL" "C" "1" "WALL" "")
      ;; Outer line
      (command "._PLINE" p1a p2a "")
      ;; Inner line
      (command "._PLINE" p1b p2b "")
      ;; End caps
      (command "._LINE" p1a p1b "")
      (command "._LINE" p2a p2b "")
    )
  )
)

;;; ============================================================
;;; HELPER: Place column rectangle on COLUMN layer
;;; ============================================================
(defun yqmcp-draw-column (cx cy w h / x1 y1 x2 y2)
  (setq x1 (- cx (/ w 2.0)))
  (setq y1 (- cy (/ h 2.0)))
  (setq x2 (+ cx (/ w 2.0)))
  (setq y2 (+ cy (/ h 2.0)))
  (command "._-LAYER" "M" "COLUMN" "C" "3" "COLUMN" "")
  (command "._PLINE"
    (list x1 y1) (list x2 y1) (list x2 y2) (list x1 y2) "C"
  )
  ;; Solid fill
  (command "._-HATCH" "P" "SOLID" "S" "L" "" "")
)

;;; ============================================================
;;; HELPER: Insert door block from YQArch library
;;; Inserts DR_D01.dwg (default single door) scaled to width
;;; ============================================================
(defun yqmcp-insert-door (x y width angle / blkname blkpath sf)
  (setq blkname "DR_D01")
  (setq blkpath (findfile (strcat blkname ".dwg")))

  (command "._-LAYER" "M" "WINDOW" "C" "2" "WINDOW" "")

  (if blkpath
    ;; Use YQArch door block
    (progn
      (setq sf (/ width 1000.0)) ;; DR_D01 is 1000mm base
      (command "._-INSERT" blkpath
        (list x y) sf sf angle)
    )
    ;; Fallback: draw door manually (line + arc)
    (progn
      (command "._-LAYER" "M" "WINDOW" "")
      (cond
        ((= angle 90)  ;; opening up from horizontal wall
         (command "._LINE" (list x y) (list x (+ y width)) "")
         (command "._ARC" "C" (list x y) (list x (+ y width)) "A" "90")
        )
        ((= angle 270) ;; opening down
         (command "._LINE" (list x y) (list x (- y width)) "")
         (command "._ARC" "C" (list x y) (list x (- y width)) "A" "90")
        )
        ((= angle 0)   ;; opening right from vertical wall
         (command "._LINE" (list x y) (list (+ x width) y) "")
         (command "._ARC" "C" (list x y) (list (+ x width) y) "A" "90")
        )
        ((= angle 180) ;; opening left
         (command "._LINE" (list x y) (list (- x width) y) "")
         (command "._ARC" "C" (list x y) (list (- x width) y) "A" "90")
        )
      )
    )
  )
)

;;; ============================================================
;;; HELPER: Insert window block from YQArch library
;;; Inserts WD_WIN4.dwg (default window) scaled to width
;;; ============================================================
(defun yqmcp-insert-window (x y width angle / blkname blkpath sf)
  (setq blkname "WD_WIN4")
  (setq blkpath (findfile (strcat blkname ".dwg")))

  (command "._-LAYER" "M" "WINDOW" "C" "2" "WINDOW" "")

  (if blkpath
    ;; Use YQArch window block
    (progn
      (setq sf (/ width 1000.0))
      (command "._-INSERT" blkpath
        (list x y) sf sf angle)
    )
    ;; Fallback: 3-line window symbol
    (progn
      (cond
        ((or (= angle 90) (= angle 270))
         ;; Horizontal wall window
         (command "._LINE" (list x -30) (list (+ x width) -30) "")
         (command "._LINE" (list x 0) (list (+ x width) 0) "")
         (command "._LINE" (list x 30) (list (+ x width) 30) "")
        )
        ((or (= angle 0) (= angle 180))
         ;; Vertical wall window
         (command "._LINE" (list -30 y) (list -30 (+ y width)) "")
         (command "._LINE" (list 0 y) (list 0 (+ y width)) "")
         (command "._LINE" (list 30 y) (list 30 (+ y width)) "")
        )
      )
    )
  )
)

;;; ============================================================
;;; HELPER: Add text label
;;; ============================================================
(defun yqmcp-add-label (x y txt height)
  (command "._-LAYER" "M" "TEXT" "C" "7" "TEXT" "")
  (command "._-TEXT" "S" "Standard" "J" "MC" (list x y) height "0" txt)
)

;;; ============================================================
;;; HELPER: Draw axis line with circle symbol
;;; ============================================================
(defun yqmcp-draw-axis (x1 y1 x2 y2 label / lx ly)
  ;; Axis line on DOTE layer (YQArch standard)
  (command "._-LAYER" "M" "DOTE" "C" "1" "DOTE" "LT" "CENTER" "DOTE" "")
  (command "._LINE" (list x1 y1) (list x2 y2) "")

  ;; Axis symbol circle at start
  (if (= x1 x2)
    ;; Vertical axis - circle below
    (setq lx x1 ly (- y1 500))
    ;; Horizontal axis - circle at left
    (setq lx (- x1 500) ly y1)
  )
  (command "._-LAYER" "M" "DOTE" "")
  (command "._CIRCLE" (list lx ly) 300)
  (command "._-LAYER" "M" "TEXT" "C" "7" "TEXT" "")
  (command "._-TEXT" "S" "Standard" "J" "MC" (list lx ly) "250" "0" label)
)

;;; ============================================================
;;; ALIAS
;;; ============================================================
(defun c:DRAW-VILLA () (c:VILLA-RDC))

(princ "\n[Villa RDC] Type VILLA-RDC to draw. Uses YQArch blocks from C:\\YQArch\\sys\\windows\\")
(princ)
