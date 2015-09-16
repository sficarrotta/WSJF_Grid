WSJF_Grid
=========================

## Overview
SDK V2.0
Weighted Shortest Job First Grid This app displays a grid that shows the values
used to calculate the WSJF score, and then calculate the score. The values in 
the grid are editable, but the score is not as it is calculated based on the
values. 

This uses the most recent grid widget, meaning it allows column sorting/
rearranging, filtering, ability to display other fields, and is exportable to 
excel. The app also has a PI Type selection field and a Release Timebox.
Project Scope is obeyed.

This app also has "App Settings" which allow you to map custom fields for use
in the calculation. In the App Settings there is an "Executive Mandate" field
option. If check the box and map the field, this field will serve as a
multiplier against the numerator. If the field is not set/mapped, it will
be defaluted to "1" and have no impact on the WSJF calculation.

The WSJF score calculation is 
( Time Criticality + RR/OE Value + User/Business Value) * ExecutiveMandate/ Job Size 

## Screen Shot
![WSJF Grid](https://github.com/sficarrotta/WSJF_Grid/blob/master/WSJF_Grid.png)
![WSJF Grid](https://github.com/sficarrotta/WSJF_Grid/blob/master/AppSettings.png)


## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0rc3/doc/)
