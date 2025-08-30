import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal as RNModal, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

type CustomDatePickerProps = {
  label?: string;
  value?: Date | undefined;
  onChange: (date: Date) => void;
};

export default function CustomDatePicker({ label = "Date", value, onChange }: CustomDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        label={label}
        mode="outlined"
        value={value ? value.toDateString() : ""} // To handle the case where sometimes the value is empty/null
        onPress={() => setShowPicker(true)}
        readOnly
      />

      {showPicker && (
        <RNModal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 16,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 5,
                elevation: 5,
                alignItems: "center",
                paddingBottom: 40,
              }}
            >
              <DateTimePicker
                value={value ?? new Date()}  // To handle the case where sometimes the value is empty/null
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_e, selected) => {
                  if (selected) onChange(selected);
                }}
              />
              <Button
                onPress={() => setShowPicker(false)}
                labelStyle={{ fontSize: 18 }}
              >
                Done
              </Button>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}