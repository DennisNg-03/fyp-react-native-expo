import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface SpecialityDropdownProps {
  selectedSpeciality?: string;
  setSelectedSpeciality: (value?: string) => void;
}

const specialities = [
  "Cardiology",
  "Chiropractic",
  "Dentistry",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Practitioner (GP)",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
  "Orthopaedics",
  "Pediatrics",
  "Physiotherapy",
  "Psychiatry",
  "Rheumatology",
  "Urology",
];

const specialityOptions = specialities.map((speciality) => ({
  label: speciality,
  value: speciality,
}));

export const SpecialityDropdown = ({
  selectedSpeciality,
  setSelectedSpeciality,
}: SpecialityDropdownProps) => {
  const theme = useTheme();

  return (
    <View style={{ marginBottom: 16 }}>
      <Dropdown
        label="Speciality"
        placeholder="Select speciality"
        options={specialityOptions}
        value={selectedSpeciality}
        onSelect={setSelectedSpeciality}
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