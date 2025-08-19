import { ActivityIndicator } from "@/components/ActivityIndicator";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";

const Index = () => {
	const { session, role } = useAuth();

	console.log("Index Session Data:", session);

	if (!session) {
		return <Redirect href={"/login"} />;
	}

	if (!role) {
		return <ActivityIndicator />;
	}

	return <Redirect href={"/home"} />;
};

export default Index;
