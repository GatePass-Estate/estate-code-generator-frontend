import { View, Text } from "react-native";

export default function AdminUsersPage() {
  return (
    <View className="min-h-screen bg-[#F9FAFB] px-10 py-8">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-[22px] font-semibold text-[#111827]">
          All Users
        </Text>
      </View>

      {/* Stats */}
      <View className="mb-8 grid grid-cols-3 gap-6">
        <View className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-5">
          <Text className="text-sm text-[#6B7280]">Residents</Text>
          <Text className="mt-2 text-2xl font-semibold text-[#111827]">
            245
          </Text>
        </View>

        <View className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-5">
          <Text className="text-sm text-[#6B7280]">Security Personnel</Text>
          <Text className="mt-2 text-2xl font-semibold text-[#111827]">
            178
          </Text>
        </View>

        <View className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-5">
          <Text className="text-sm text-[#6B7280]">Total Users</Text>
          <Text className="mt-2 text-2xl font-semibold text-[#111827]">
            423
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="mb-4 flex flex-row justify-end">
        <View className="w-72 rounded-md border border-[#E5E7EB] bg-white px-4 py-2">
          <Text className="text-sm text-[#9CA3AF]">Search users</Text>
        </View>
      </View>

      {/* Table */}
      <View className="rounded-lg border border-[#E5E7EB] bg-white">
        {/* Table header */}
        <View className="grid grid-cols-6 border-b border-[#E5E7EB] px-6 py-3 text-sm text-[#6B7280]">
          <Text>Name</Text>
          <Text>Email</Text>
          <Text>Role</Text>
          <Text>Status</Text>
          <Text>Date Joined</Text>
          <Text className="text-right">Action</Text>
        </View>

        {/* Rows */}
        {[
          {
            name: "Sandra Happiness",
            email: "sandra@email.com",
            role: "Resident",
            status: "Active",
            date: "12 Jan 2024",
          },
          {
            name: "John Doe",
            email: "john@email.com",
            role: "Security",
            status: "Inactive",
            date: "03 Feb 2024",
          },
        ].map((user, idx) => (
          <View
            key={idx}
            className="grid grid-cols-6 items-center border-b border-[#F1F5F9] px-6 py-4 text-sm text-[#111827]"
          >
            <Text>{user.name}</Text>
            <Text>{user.email}</Text>
            <Text>{user.role}</Text>
            <Text>{user.status}</Text>
            <Text>{user.date}</Text>
            <Text className="text-right text-[#2563EB]">View</Text>
          </View>
        ))}
      </View>

      {/* Pagination */}
      <View className="mt-6 flex flex-row justify-end gap-2">
        <View className="rounded border border-[#E5E7EB] px-3 py-1 text-sm text-[#6B7280]">
          <Text>Prev</Text>
        </View>
        <View className="rounded border border-[#E5E7EB] bg-[#111827] px-3 py-1 text-sm text-white">
          <Text>1</Text>
        </View>
        <View className="rounded border border-[#E5E7EB] px-3 py-1 text-sm text-[#6B7280]">
          <Text>2</Text>
        </View>
        <View className="rounded border border-[#E5E7EB] px-3 py-1 text-sm text-[#6B7280]">
          <Text>Next</Text>
        </View>
      </View>
    </View>
  );
}
