import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface HealthcareProviderDropdownProps {
  selectedProvider: string | undefined;
  setSelectedProvider: (value?: string) => void;
	disabled?: boolean;
}

interface Provider {
  id: string;
  name: string;
}

export const HealthcareProviderDropdown = ({
  selectedProvider,
  setSelectedProvider,
	disabled = false,
}: HealthcareProviderDropdownProps) => {
  const theme = useTheme();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("healthcare_providers")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.log("Error fetching healthcare providers:", error.message);
      } else {
        setProviders(data);
      }
      setLoading(false);
    };

    fetchProviders();
  }, []);

  const dropDownItems = providers.map((provider) => ({
    label: provider.name,
    value: provider.id,
  }));

  return (
    <View style={{ marginBottom: 10 }}>
      <Dropdown
        label="Healthcare Provider"
        placeholder="Select a provider"
        options={dropDownItems}
        value={selectedProvider}
        onSelect={setSelectedProvider}
        mode="outlined"
        menuContentStyle={{
          backgroundColor: theme.colors.onPrimary,
          borderRadius: 8,
        }}
        hideMenuHeader
				disabled={disabled}
      />
      {providers.length === 0 && !loading && (
        <Text style={{ color: theme.colors.error, marginTop: 4 }}>
          No providers found.
        </Text>
      )}
    </View>
  );
};