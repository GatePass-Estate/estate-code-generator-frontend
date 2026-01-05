import { View, Text, TouchableOpacity } from "react-native";

const MOCK_REQUEST = {
  name: "Sandra Happiness",
  field: "Phone Number",
  before: "+234 801 234 5678",
  after: "+234 803 987 6543",
  date: "12 Aug 2024",
};

export default function EditRequestDetailPage() {
  return (
    <View className="flex-1 bg-page px-6 pt-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-text-primary text-2xl font-semibold">
          Edit Request
        </Text>
        <Text className="text-text-secondary text-sm mt-1">
          Review requested profile change
        </Text>
      </View>

      {/* User Info */}
      <View className="bg-card border border-border rounded-xl p-5 mb-8">
        <Text className="text-text-muted text-xs uppercase mb-1">User</Text>
        <Text className="text-text-primary font-medium">
          {MOCK_REQUEST.name}
        </Text>

        <Text className="text-text-muted text-xs uppercase mt-4 mb-1">
          Field
        </Text>
        <Text className="text-text-secondary">{MOCK_REQUEST.field}</Text>
      </View>

      {/* Comparison */}
      <View className="flex-row gap-6 mb-8">
        {/* Before */}
        <View className="flex-1 border border-border rounded-xl p-5">
          <Text className="text-text-muted text-xs uppercase mb-2">Before</Text>
          <Text className="text-text-primary font-medium">
            {MOCK_REQUEST.before}
          </Text>
        </View>

        {/* After */}
        <View className="flex-1 border border-border rounded-xl p-5 bg-highlight">
          <Text className="text-text-muted text-xs uppercase mb-2">After</Text>
          <Text className="text-text-primary font-medium">
            {MOCK_REQUEST.after}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-6">
        <TouchableOpacity className="flex-1 bg-secondary py-4 rounded-lg">
          <Text className="text-center text-white font-medium">Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 border border-border py-4 rounded-lg">
          <Text className="text-center text-text-primary font-medium">
            Decline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
