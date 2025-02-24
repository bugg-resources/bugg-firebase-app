import moment, { Moment } from "moment";
import React, { memo, useState } from "react";
import { DateRangePicker } from "react-dates";
import "react-dates/initialize";
import { StyleSheet, View } from "react-native";
import { useRecoilState } from "recoil";
import { dateRangeAtom } from "../data/useApplication";
import "./date-range-selector.css";

moment.locale("en-gb");

interface DateRangeSelectorProps {}

function DateRangeSelector(props: DateRangeSelectorProps) {
  let [dates, setDates] = useRecoilState(dateRangeAtom);
  let [focusedInput, setfocusedInput] = useState(null as any);

  return (
    <View style={styles.wrap}>
      <DateRangePicker
        startDate={dates.startDate} // momentPropTypes.momentObj or null,
        startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
        endDate={dates.endDate} // momentPropTypes.momentObj or null,
        endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
        onDatesChange={({ startDate, endDate }) =>
          setDates({ startDate, endDate })
        } // PropTypes.func.isRequired,
        focusedInput={focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
        onFocusChange={setfocusedInput} // PropTypes.func.isRequired,
        // withFullScreenPortal={true}
        hideKeyboardShortcutsPanel={true}
        orientation={"horizontal"}
        small={true}
        isOutsideRange={(candidate: Moment) => {
          if (candidate.isBefore(moment("2021-03-01"))) {
            return true;
          }
          return candidate.isAfter(moment());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // display: "flex",
    // flexDirection: "row",
    // justifyContent: "flex-start",
    // alignItems: "center",
    zIndex: 10,
    // borderStyle: "solid",
    // borderWidth: 1,
    // borderColor: "#BDCBD4",
    // borderRadius: 8,
    // height: 38,
    marginRight: 16,
  },
});

export default memo(DateRangeSelector);
