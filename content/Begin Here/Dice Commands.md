Both Inheritors and Wardens can use the dice roller by . The following dice commands are valid:

| How to…                                           | Command  | Result                                                                                                                                            |
| ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roll a number of dice**                         | XdY      | Where X is a number of any Y type of die                                                                                                          |
| **Roll a number of dice against a target number** | XdY vs T | Where T is a target number; <br>- if the result is lower, a green success checkmark appears<br>- if the result is higher, a red failure x appears |
| **Roll a number of dice with advantage**          | XdY adv  | Rolls with advantage (keeping the better result)                                                                                                  |
| **Roll a number of dice with disadvantage**       | XdY dis  | Rolls with disadvantage (keeping the worse result)                                                                                                |
| **Roll a number of dice with modifiers**          | XdY±M    | Where M is some modifier (can be other dice, like 2d6) that is either added or subtracted                                                         |
| **Roll a number of exploding dice**               | XdY!     | Where ! represents exploding dice, rerolling XdY and adding the maximum result to the new result                                                  |

You can, of course, combine these for all sorts of weirdness (like 3d6! dis vs 10 or 2d6-3d4+10). I’d like to add support for even more niche commands but for now this covers the basics needed for Inheritor. 