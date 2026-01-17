import AccessCodeCard from "@/src/components/web/AccessCodeCard";
import WebSidebar from "@/src/components/web/WebSidebar";
import icons from "@/src/constants/icons";
import { useRouter } from "expo-router";
import { Image, Platform } from "react-native";
import { menuRoutes } from "./_layout";
import { useEffect, useState } from "react";
import Modal from "@/src/components/web/Modal";
import { Guest } from "@/src/types/guests";
import { deleteMyGuest, getMyGuests } from "@/src/lib/api/guests";
import { deleteCode, generateCode, getAllCodes } from "@/src/lib/api/codes";
import { useUserStore } from "@/src/lib/stores/userStore";
import { Codes } from "@/src/types/codes";
import { GenderType, RelationshipType } from "@/src/types/general";
import { Pagination } from "@/src/components/web/Pagination";
import images from "@/src/constants/images";
import { timeCalc } from "@/src/lib/helpers";

const CODES_PAGE_SIZE = 3;
const GUESTS_PAGE_SIZE = 6;

export default function HomeWeb() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [codes, setCodes] = useState<Codes[]>([]);
  const [codesPage, setCodesPage] = useState<number>(1);
  const [guestsPage, setGuestsPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<"guest" | "code" | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [generatingGuestId, setGeneratingGuestId] = useState<string | null>(
    null
  );

  const filteredGuests = guests.filter(
    (guest) =>
      guest.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.relationship?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const codesTotalPages = Math.max(
    1,
    Math.ceil(codes.length / CODES_PAGE_SIZE)
  );
  const guestsTotalPages = Math.max(
    1,
    Math.ceil(filteredGuests.length / GUESTS_PAGE_SIZE)
  );

  const codesPaginated = codes.slice(
    (codesPage - 1) * CODES_PAGE_SIZE,
    codesPage * CODES_PAGE_SIZE
  );
  const guestsPaginated = filteredGuests.slice(
    (guestsPage - 1) * GUESTS_PAGE_SIZE,
    guestsPage * GUESTS_PAGE_SIZE
  );

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const result = await getMyGuests();
      setGuests(result.items);
    } catch (error) {
      console.error("Failed to fetch guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const result = await getAllCodes(useUserStore.getState().user_id);
      setCodes(result.items.filter((code) => !code.is_expired));
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const performDeleteGuest = async (id: string) => {
    setDeleting(true);
    try {
      await deleteMyGuest(id);
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Delete guest failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  const requestDeleteGuest = (id: string) => {
    setPendingGuestId(id);
    setPendingType("guest");
    setConfirmModalVisible(true);
  };

  const performRemoveCode = async (code: string) => {
    setDeleting(true);
    try {
      await deleteCode(code);
      setCodes((prev) => prev.filter((c) => c.hashed_code !== code));
    } catch (error) {
      console.error("Remove code failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  async function handleGenerateCode({
    name,
    relationship_with_resident,
    gender,
    guestId,
  }: {
    name: string;
    gender: GenderType;
    relationship_with_resident: RelationshipType;
    guestId: string;
  }) {
    setRunning(true);
    setGeneratingGuestId(guestId);
    try {
      const result = await generateCode({
        user_id: useUserStore.getState().user_id,
        estate_id: useUserStore.getState().estate_id ?? "",
        visitor_fullname: name,
        relationship_with_resident,
        gender,
      });

      let { formattedDate, timeframe } = timeCalc(result.valid_until);

      router.push({
        pathname: `/invite`,
        params: {
          code: result.hashed_code,
          name,
          address: `${useUserStore.getState().home_address}, ${
            useUserStore.getState().estate_name
          }.`,
          timeframe,
          date: formattedDate,
        },
      });
    } catch (error) {
      setError("Failed to generate code. Please try again.");
    } finally {
      setRunning(false);
      setGeneratingGuestId(null);
    }
  }

  useEffect(() => {
    fetchGuests();
    fetchCodes();
    if (Platform.OS === "web") document.title = "Home - GatePass";
  }, []);

  useEffect(() => {
    if (codesPage > codesTotalPages) setCodesPage(codesTotalPages);
  }, [codes, codesTotalPages, codesPage]);

  useEffect(() => {
    if (guestsPage > guestsTotalPages) setGuestsPage(guestsTotalPages);
  }, [filteredGuests, guestsTotalPages, guestsPage]);

  useEffect(() => {
    setGuestsPage(1);
  }, [searchQuery]);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes
          .filter((el) => el.for === "web" || el.for === "both")
          .map((data) => data)}
        onNavigate={(route) => router.push(route as any)}
      />

      <div className="web-body">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-base text-tertiary">Loading...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-center gap-7 mt-20">
              <h1 className="text-4xl">Active Codes</h1>

              <div className="flex flex-wrap gap-3 mb-6">
                {codesPaginated.map((code, i) => {
                  let gender = code.gender;

                  if (gender !== "male" && gender !== "female")
                    gender = "prefer_not_to_say";

                  const iso = String(code.valid_until ?? "")
                    .replace(" ", "T")
                    .replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
                  const parsed = new Date(iso);

                  let formattedDate = "Invalid date";
                  let timeframe = "Unknown";
                  let timeLeftMinutes = 0;

                  if (!isNaN(parsed.getTime())) {
                    const day = String(parsed.getDate()).padStart(2, "0");
                    const month = String(parsed.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const year = parsed.getFullYear();
                    formattedDate = `${day}/${month}/${year}`;

                    const diffMs = parsed.getTime() - Date.now();
                    if (diffMs <= 0) {
                      timeframe = "Expired";
                    } else {
                      const startDate = new Date(
                        parsed.getTime() - 60 * 60 * 1000
                      );
                      const formatTime = (d: Date) =>
                        d
                          .toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(/\s+/g, "")
                          .toLowerCase();
                      timeLeftMinutes = Math.floor((diffMs % 3600000) / 60000);
                      timeframe = `${formatTime(startDate)} to ${formatTime(
                        parsed
                      )}`;
                    }
                  }

                  return (
                    <AccessCodeCard
                      key={code.hashed_code}
                      code={code.hashed_code}
                      estate_id={code.estate_id}
                      details={{
                        name: code.visitor_fullname || "Guest",
                        address: `${useUserStore.getState().home_address}, ${
                          useUserStore.getState().estate_name
                        }.`,
                        date: formattedDate,
                        timeframe,
                      }}
                      variant={gender}
                      timeLeftMinutes={parsed.getTime()}
                      removeCode={performRemoveCode}
                      onExpire={() => {
                        setCodes((prev) =>
                          prev.filter((c) => c.hashed_code !== code.hashed_code)
                        );
                      }}
                    />
                  );
                })}
              </div>

              {codes.length === 0 ? (
                <div className="mb-28 flex flex-col justify-center items-center gap-2">
                  <Image
                    source={images.ghostImg}
                    style={{ width: 100, height: 100 }}
                  />
                  <p className="text-lg text-center text-gray-400">
                    No active codes found.
                  </p>
                </div>
              ) : (
                <div className="flex justify-end mb-6">
                  <Pagination
                    currentPage={codesPage}
                    totalPages={codesTotalPages}
                    onPageChange={setCodesPage}
                    condition={running}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-4 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-blackq">
                  My Guest List
                </h2>

                <input
                  type="text"
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                {guestsPaginated.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-center p-3 bg-light-grey w-full rounded-lg"
                  >
                    <Image
                      source={
                        item.gender === "male"
                          ? icons.maleIcon
                          : item.gender === "prefer_not_to_say"
                          ? icons.notSayingGender
                          : icons.femaleIcon
                      }
                      style={{
                        width: 25,
                        height: item.gender === "female" ? 37 : 25,
                      }}
                    />

                    <div className="flex flex-col">
                      <p className="text-xl capitalize font-UbuntuSans">
                        {item.guest_name}
                      </p>
                      <span className="text-xs capitalize font-Inter text-primary">
                        {item.relationship}
                      </span>
                    </div>

                    <div className="flex gap-3 ml-auto">
                      <button
                        type="button"
                        className={`capitalize px-6 py-2 bg-teal font-semibold rounded-lg text-white text-base ${
                          !!generatingGuestId && "opacity-65"
                        }`}
                        onClick={() => requestDeleteGuest(item.id)}
                        disabled={running}
                      >
                        delete
                      </button>
                      <button
                        type="button"
                        className={`capitalize px-8 py-3 bg-primary font-semibold rounded-lg text-white text-base ${
                          !!generatingGuestId && "opacity-65"
                        }`}
                        onClick={() =>
                          handleGenerateCode({
                            name: item.guest_name,
                            relationship_with_resident: item.relationship,
                            gender: item.gender,
                            guestId: item.id,
                          })
                        }
                        disabled={!!generatingGuestId}
                      >
                        {generatingGuestId === item.id
                          ? "Generating code..."
                          : "generate code"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredGuests.length === 0 ? (
                <div className="mb-28 flex flex-col justify-center items-center gap-2">
                  <Image
                    source={images.ghostImg}
                    style={{ width: 100, height: 100 }}
                  />
                  <p className="text-lg text-center text-gray-400">
                    {searchQuery
                      ? "No guests match your search."
                      : "No guests were found"}
                  </p>
                </div>
              ) : (
                <div className="flex justify-end mt-4">
                  <Pagination
                    currentPage={guestsPage}
                    totalPages={guestsTotalPages}
                    onPageChange={setGuestsPage}
                    condition={running}
                  />
                  <br />
                  <br />
                  <br />
                </div>
              )}
            </div>

            {confirmModalVisible && pendingType === "guest" && (
              <Modal
                closeModal={() => {
                  setConfirmModalVisible(false);
                  setPendingGuestId(null);
                  setPendingType(null);
                }}
                heading={"Confirm delete"}
                message={`Are you sure you want to delete this guest? This action cannot be undone.`}
                btnDisabled={deleting}
                actionRunnig={deleting}
                cancelText={"Cancel"}
                action={async () => {
                  if (!pendingGuestId) return;
                  await performDeleteGuest(pendingGuestId);
                  setConfirmModalVisible(false);
                  setPendingGuestId(null);
                  setPendingType(null);
                }}
                runningText={"Deleting..."}
                actionText={"Delete"}
              />
            )}

            {error && (
              <Modal
                closeModal={() => {
                  setError("");
                }}
                heading={"Sorry, an error occurred"}
                message={error}
                cancelText={"Cancel"}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
