WSJF_Grid
=========================
## Attention: New version available based on sdk 2.0rc2 
Find it here: https://github.com/sficarrotta/WSJF_V3
This version no longer requires custom fields but uses Rally OTB fields. If you are working on an
on-premise version of Rally please ensusre that these new Rally fields are available as well as the
2.0rc2 version of the sdk. Please note that there is a know bug with this version that will sometimes
turn an edited cell red. To fix it, just click on cell again, then change focus from the edited cell.

## Overview
SDK V2.0
Weighted Shortest Job First Grid This app displays a grid that shows the values
used to calculate the WSJF score, and then calculate the score. The values in 
the grid are editable, but the score is not as it is calculated based on the
values. The columns are sortable, so for example if you want to sort by Score, 
just click on the "Score" column.

The Details: The app has a PI Type selection field and a Release Timebox. Note 
that the Release Timebox is only used when the lowest level PI Type is selected,
e.g. "Feature". Project Scope is obeyed.
The WSJF score calculation is 
( Time Criticality + RR/OE Value + User/Business Value)/ Job Size 

## Screen Shot
![WSJF Grid](https://github.com/sficarrotta/WSJF_Grid/blob/master/WSJF_Grid.png)


## License

The Details:
The app is designed to work with Portfolio Items of type "Feature". No other filtering is handled,
but could be added.
The WSJF score calculation is ( Time Value + OERR + User Value)/ Job Size (rounded to nearest integer)
The app assumes Portfolio Items include the following custom integer fields. Make sure the following names are
entered into the Display Name of the integer field. If you change the display name to something else,
be sure to update the app accordingly.

Time Value <br>
OERR <br>
User Value <br>
Job Size <br>
Score <br>

Screencast Demo
---------------

http://screencast.com/t/aCOOhkpeHdXA

Screenshot
----------

![Rally Tree Grid Screenshot](https://raw.github.com/RallyCommunity/WSJF_Grid/master/deploy/WSJF_Grid.png)

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0rc3/doc/)
