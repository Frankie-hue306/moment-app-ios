#!/bin/bash
# Check for Apple reply emails
osascript -e '
tell application "Mail"
    set recentMails to messages of inbox whose date received > (current date) - 60 * minutes
    set found to false
    repeat with msg in recentMails
        if subject of msg contains "Case-ID: 20628676" then
            set found to true
            exit repeat
        end if
    end repeat
    if found then
        display notification "Apple replied! Check your email" with title "App Store"
        say "Apple replied"
    end if
end tell
' 2>/dev/null
