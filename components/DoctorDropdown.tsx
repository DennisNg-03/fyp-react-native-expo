import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface DoctorDropdownProps {
  providerId: string;
  selectedDoctorId?: string;
  setSelectedDoctor: (value?: string) => void;
}

interface Doctor {
  id: string;
  full_name: string;
}

export const DoctorDropdown = ({
  providerId,
  selectedDoctorId,
  setSelectedDoctor,
}: DoctorDropdownProps) => {
  const theme = useTheme();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id, profiles(full_name)")
          .eq("provider_id", providerId);

        if (error) throw error;

        setDoctors(
          (data ?? []).map((doc: any) => ({
            id: doc.id,
            full_name: doc.profiles?.full_name ?? "Unknown",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    if (providerId) fetchDoctors();
  }, [providerId]);

  const doctorOptions = doctors.map((doc) => ({
    label: doc.full_name,
    value: doc.id,
  }));

  return (
    <View style={{ marginBottom: 16 }}>
      <Dropdown
        label="Assigned Doctor"
        placeholder={loading ? "Loading..." : "Select doctor"}
        options={doctorOptions}
        value={selectedDoctorId}
        onSelect={setSelectedDoctor}
        mode="outlined"
        menuContentStyle={{
          backgroundColor: theme.colors.onPrimary,
          borderRadius: 10,
        }}
        hideMenuHeader
      />
    </View>
  );
};