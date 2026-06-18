#!/bin/bash
# Deploy Gate — reads stdin JSON, checks if command is a live deploy
# Exits 0 with permissionDecision=ask if live deploy detected
# Exits 0 silently if not a live deploy (safe to proceed)

INPUT=$(cat)

# Extract command from JSON input
CMD=$(echo "$INPUT" | /Users/rajeevnaik/.nvm/versions/node/v24.16.0/bin/node -e "
var d=''; process.stdin.on('data',function(c){d+=c;}); process.stdin.on('end',function(){
  try { var o=JSON.parse(d); console.log(o.input&&o.input.command ? o.input.command : (o.command||'')); }
  catch(e){ console.log(''); }
});" 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

# Check if this is a live deploy (not staging, not dev, not rollback, not list)
IS_LIVE=$(/Users/rajeevnaik/.nvm/versions/node/v24.16.0/bin/node -e "
var cmd='$CMD';
var live=false;
if(/wrangler\s+(deployments|versions|rollback)\b/.test(cmd)){live=false;}
else if(/wrangler\s+deploy\b/.test(cmd)&&/(staging|wrangler\.dev)/.test(cmd)){live=false;}
else if(/wrangler\s+deploy\b/.test(cmd)){live=true;}
else if(/npm run deploy\b/.test(cmd)&&!/(staging|:dev)/.test(cmd)){live=true;}
console.log(live?'yes':'no');
" 2>/dev/null)

if [ "$IS_LIVE" = "yes" ]; then
  echo '{"hookSpecificOutput":{"permissionDecision":"ask","permissionDecisionReason":"🚀 LIVE DEPLOY DETECTED — This will push to production (scrabblewordsfinder.com or xconvert24.com). Raj must confirm: say Ship It or Full Throttle to proceed."}}'
fi

exit 0
