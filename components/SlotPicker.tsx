// components/SlotPicker.tsx
import { Slot } from "@/types/appointment";
import { formatKL } from "@/utils/dateHelpers";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type SlotPickerProps = {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
};

export function SlotPicker({ slots, selectedSlot, onSelect }: SlotPickerProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {slots.map((slot) => {
        const startLocal = formatKL(slot.slot_start, "HH:mm");
        const endLocal = formatKL(slot.slot_end, "HH:mm");
        const disabled = slot.is_blocked;
        const selected = selectedSlot?.slot_start === slot.slot_start;

        return (
          <TouchableOpacity
            key={slot.slot_start}
            disabled={disabled}
            onPress={() => onSelect(slot)}
            style={{
              marginVertical: 4,
              opacity: disabled ? 0.4 : 1,
              borderRadius: 12,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primary : "#ccc",
              paddingVertical: 8,
              alignItems: "center",
							width: "32.5%",
              backgroundColor: selected ? "#f2e7ff" : "white",
            }}
          >
            <Text style={{ fontSize: 12 }}>{`${startLocal} – ${endLocal}`}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}