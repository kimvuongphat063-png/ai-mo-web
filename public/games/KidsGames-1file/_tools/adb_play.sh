# Helpers to play a game inside Kids Games Player on the emulator with real touches.
#   source _tools/adb_play.sh ; L 640 470   (tap logical point) ; LS x1 y1 x2 y2 ms (swipe)
# Game viewport on the 1920x1080 emulator: x from 200 (player side bar) to 1920, letterboxed 16:9.
export MSYS_NO_PATHCONV=1
ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
SER=${SER:-emulator-5556}
GX=${GX:-200}; GW=${GW:-1720}; GH=${GH:-1080}
SC=$(awk -v w=$GW -v h=$GH 'BEGIN{s=w/1280; if (h/720<s) s=h/720; print s}')
OX=$(awk -v w=$GW -v s=$SC -v gx=$GX 'BEGIN{print gx+(w-1280*s)/2}')
OY=$(awk -v h=$GH -v s=$SC 'BEGIN{print (h-720*s)/2}')
px() { awk -v v=$1 -v s=$SC -v o=$OX 'BEGIN{printf "%d", o+v*s}'; }
py() { awk -v v=$1 -v s=$SC -v o=$OY 'BEGIN{printf "%d", o+v*s}'; }
L() { "$ADB" -s $SER shell input tap $(px $1) $(py $2); }
LS() { "$ADB" -s $SER shell input swipe $(px $1) $(py $2) $(px $3) $(py $4) ${5:-500}; }
SHOT() { "$ADB" -s $SER exec-out screencap -p > "$1"; }
