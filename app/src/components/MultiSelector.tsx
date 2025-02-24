import React, { useCallback, useState } from "react";
//@ts-ignore
import ReactMultiSelectCheckboxes from "react-multiselect-checkboxes";

interface MultiSelectorProps {
  title: string;
  selected: {
    label: string;
    value: string;
  }[];
  options: {
    value: string;
    label: string;
  }[];
  onComplete: (selection: any) => void;
}

export function MultiSelector(props: MultiSelectorProps) {
  let [selected, setSelected] = useState(props.selected);

  let onBlur = useCallback(() => {
    // Triggered when the menu closes. Update the filter if needed...
    props.onComplete(selected);
  }, [selected, props.onComplete]);

  let onChange = useCallback(
    (selected: any[], action: any) => {
      setSelected(selected);
    },
    [setSelected]
  );

  return (
    <ReactMultiSelectCheckboxes
      options={props.options}
      placeholderButtonLabel={props.title}
      getDropdownButtonLabel={(info: any) => {
        let items = info.value || [];
        if (items.length === 0) {
          return info.placeholderButtonLabel;
        }

        if (items.length === 1) {
          return info.value[0].label;
        }

        if (items.length > 1) {
          return `${info.value.length} ${info.placeholderButtonLabel}`;
        }
      }}
      styles={MultiSelectStyles}
      value={selected}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}
export default MultiSelector;

export const MultiSelectStyles = {
  dropdownButton: (provided: any, state: any) => {
    let hasValue = state?.value?.length > 0;

    let extras = {
      borderColor: "#BDCBD4",
    };

    if (hasValue) {
      extras.borderColor = "#FF512A";
    }

    return {
      ...provided,
      width: "100%",
      flexGrow: 1,
      flexBasis: 1,
      height: 38,
      borderRadius: 8,
      borderStyle: "solid",
      borderWidth: 1,

      boxShadow: null,
      ...extras,
    };
  },
  container: (provided: any, state: any) => {
    return {
      ...provided,
      boxShadow: "0 1px 1px 1px rgba(0, 0, 0, 0.08)",
    };
  },
  menuPortal: (provided: any, state: any) => {
    return {
      ...provided,
      right: 120,
    };
  },

  option: (provided: any, state: any) => {
    return {
      ...provided,
      fontFamily: "Arial",
    };
  },
  placeholder: (provided: any, state: any) => {
    return {
      ...provided,
      fontFamily: "Arial",
    };
  },
  input: (provided: any, state: any) => {
    return {
      ...provided,
      fontFamily: "Arial",
    };
  },
  noOptionsMessage: (provided: any, state: any) => {
    return {
      ...provided,
      fontFamily: "Arial",
    };
  },
};
