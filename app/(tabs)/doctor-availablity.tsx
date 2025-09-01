// Let doctors add weekly time blocks. Keep it simple; expand later with editing.
import { supabase } from "@/lib/supabase";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function DoctorAvailabilityScreen({ userId }: { userId: string }) {
  const [day, setDay] = useState<number>(1); // Monday
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from("doctor_availability").insert({
        doctor_id: userId,
        day_of_week: day,
        start_time: start,
        end_time: end
      });
      if (error) throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ margin: 16, borderRadius: 12 }}>
      <Card.Content>
        <Text variant="titleMedium">Add weekly availability</Text>
        <HelperText type="info">Times are local (GMT+8 unless you changed your profile).</HelperText>

        <Text>Day: {DAYS[day]}</Text>
        {/* Replace with a proper dropdown in your UI kit */}
        <View style={{ flexDirection:"row", marginVertical: 8 }}>
          {DAYS.map((d, i) => (
            <Button key={d} mode={i===day?"contained":"outlined"} onPress={() => setDay(i)} style={{ marginRight: 4 }}>{d}</Button>
          ))}
        </View>

        <TextInput label="Start (HH:mm)" value={start} onChangeText={setStart} style={{ marginBottom: 8 }} />
        <TextInput label="End (HH:mm)" value={end} onChangeText={setEnd} style={{ marginBottom: 12 }} />

        <Button mode="contained" onPress={add} loading={saving} disabled={saving}>Add</Button>
      </Card.Content>
    </Card>
  );
}