WSJF_Grid
=========================

## Overview
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
By default the score is an integer. If you want to have the score be a float, 
then look for this line in the code: var defaultToIntegerScore = false;
Change false to true and it will display two decimal places (scale of two). 

## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0rc3/doc/)
