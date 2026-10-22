#!/bin/bash
# usage: ./shots.sh prefix  -> standard set
U=http://localhost:5179; P=$1; Q=${2:-}
timeout 40 node shot.mjs "$U/?at=40&q=high&q=high$Q" screenshots/$P-desktop.png 1280x800 >/dev/null
timeout 40 node shot.mjs "$U/?at=40&q=high&joy$Q" screenshots/$P-fold-inner.png 884x1104 >/dev/null
timeout 40 node shot.mjs "$U/?at=40&q=high&joy$Q" screenshots/$P-fold-cover.png 360x904 >/dev/null
timeout 40 node shot.mjs "$U/?at=40&q=high&cam=1,6.5,-9&tgt=1,0.8,-1.5$Q" screenshots/$P-desks.png 1280x800 >/dev/null
timeout 40 node shot.mjs "$U/?at=228&q=high&cam=-2,6,9&tgt=-7.5,0.5,3.5$Q" screenshots/$P-lounge.png 1280x800 >/dev/null
timeout 40 node shot.mjs "$U/?at=150&q=high&cam=1,10,4&tgt=8,1,-5.5$Q" screenshots/$P-pantry.png 1280x800 >/dev/null
