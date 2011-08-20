set -e
coffee -c _attachments/js/main

osascript <<'AS'
tell application "Google Chrome"
	activate
	repeat with win in every window
		repeat with i from 1 to the number of tabs in win
			set t to tab i of win
			if the URL of t contains "posterizer" then
				reload t
				set active tab index of win to i
				exit repeat
			end if
		end repeat
	end repeat
end tell
tell application "Firefox"
	repeat with win in every window
		if the name of win contains "Posterizer" then
			activate the application
			set the index of win to 1
			tell application "System Events"
				tell application process "Firefox"
					keystroke "r" using command down
				end tell
			end tell
		end if
	end repeat
end tell
tell application "TextMate" to activate
AS
