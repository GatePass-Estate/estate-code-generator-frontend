export default function AdminUsersPage() {
  return (
    <div className="min-h-screen flex bg-white font-[Inter] text-[#2B2B2B]">
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] bg-[#063C53] text-white flex flex-col justify-between py-8 px-6">
        <div className="space-y-8">
          <div className="text-xl font-semibold">Logo</div>

          <nav className="space-y-6 text-sm">
            <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
              <IconHomeSidebar /> Home
            </button>
            <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
              <IconCode /> Generate Code
            </button>
            <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
              <IconProfile /> My Profile
            </button>

            <div className="space-y-3 pt-3">
              <button className="flex items-center gap-3 w-full bg-[#D1DFE7] text-[#063C53] font-medium rounded-md py-2 px-3">
                <IconLock /> Admin Access
              </button>
            </div>

            <div className="space-y-3 pl-2">
              <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
                <IconUsers /> See All Users
              </button>
              <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
                <IconRegister /> Register User
              </button>
              <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
                <IconBroadcast /> Send a broadcast
              </button>
              <button className="flex items-center gap-3 opacity-90 hover:opacity-100">
                <IconEdit /> Edit Requests
              </button>
            </div>
          </nav>
        </div>

        <button className="flex items-center gap-3 text-sm opacity-80 hover:opacity-100">
          <IconLogout /> Log Out
        </button>
      </aside>

      {/* RIGHT SECTION */}
      <main className="flex-1 px-12 py-10">
        {/* PAGE TITLE */}
        <h1 className="text-[28px] font-medium text-[#6E6E6E] mb-10">
          Admin Access
        </h1>

        {/* TOP CARDS */}
        <div className="flex items-center gap-4 mb-12">
          <button className="flex items-center gap-3 bg-[#D1DFE7] text-[#063C53] rounded-md px-5 py-2 text-sm font-medium">
            <IconUsers className="stroke-[#063C53]" /> See All Users
          </button>

          <div className="flex items-center gap-4">
            <CardStat
              icon={<IconHouseFill />}
              count="178"
              label="Residents"
              bg="#FFF2EA"
              stroke="#EA6F36"
            />
            <CardStat
              icon={<IconShieldFill />}
              count="178"
              label="Security Personnels"
              bg="#E9F5F3"
              stroke="#3A8B7A"
            />
            <CardStat
              icon={null}
              count="600"
              label="TOTAL"
              bg="#F5FAFC"
              stroke="#063C53"
            />
            <button className="w-[45px] h-[45px] rounded-full border border-[#D5E3E8] flex items-center justify-center">
              <IconPlus />
            </button>
          </div>
        </div>

        {/* TABLE TITLE + SEARCH */}
        <p className="text-[17px] font-medium text-[#6E6E6E] mb-4">All Users</p>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center flex-1 h-[48px] border border-[#D5E3E8] rounded-md px-3 gap-3">
            <IconSearch />
            <input
              placeholder="Search User List"
              className="flex-1 text-sm outline-none placeholder-[#A4A4A4]"
            />
          </div>
          <button className="bg-[#063C53] text-white rounded-md px-5 py-2 font-medium text-sm">
            Go
          </button>
          <button className="flex items-center gap-1 text-sm text-[#063C53]">
            <IconFilter /> Filter
          </button>
        </div>

        {/* TABLE */}
        <div className="border border-[#E5ECEF] rounded-md overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F8FBFC] text-[#6E6E6E]">
              <tr className="h-[48px]">
                <th className="font-medium px-4 text-left">Type</th>
                <th className="font-medium px-4 text-left">Name</th>
                <th className="font-medium px-4 text-left">Email Address</th>
                <th className="font-medium px-4 text-left">Phone Number</th>
                <th className="font-medium px-4 text-left">Address</th>
                <th className="font-medium px-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAEFF2]">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-[48px] text-[#2B2B2B]">
                  <td className="px-4">
                    {i % 2 === 0 ? (
                      <IconHouse stroke="#EA6F36" />
                    ) : (
                      <IconShield stroke="#3A8B7A" />
                    )}
                  </td>
                  <td className="px-4">Sandra Happiness</td>
                  <td className="px-4">SandraHappiness@gmail.com</td>
                  <td className="px-4">09728367789</td>
                  <td className="px-4">Flat 56</td>
                  <td className="px-4 flex gap-3">
                    <IconView />
                    <IconEditLine />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center gap-2 mt-6">
          <PagBtn>{"<"}</PagBtn>
          <PagBtn active>1</PagBtn>
          <PagBtn>2</PagBtn>
          <PagBtn>3</PagBtn>
          <PagBtn>{"..."}</PagBtn>
          <PagBtn>{">"}</PagBtn>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------------
   SMALL COMPONENTS FOR CLEANER VIEW
-------------------------------------- */

function CardStat({ icon, count, label, bg, stroke }: any) {
  return (
    <div
      className="w-[205px] h-[92px] rounded-md border border-[#E5ECEF] flex flex-col justify-center px-5"
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-6 h-6" style={{ color: stroke }}>
            {icon}
          </div>
        )}
        <div className="text-[24px] font-semibold" style={{ color: stroke }}>
          {count}
        </div>
      </div>
      <div className="text-[14px] text-[#6E6E6E] mt-1">{label}</div>
    </div>
  );
}

function PagBtn({ children, active }: any) {
  return (
    <button
      className={`w-[32px] h-[32px] rounded-md border border-[#D5E3E8] text-sm ${
        active ? "bg-[#063C53] text-white" : "bg-white text-[#2B2B2B]"
      }`}
    >
      {children}
    </button>
  );
}

/* --------------------------------------
   INLINE SVG ICONS — FIGMA EXACT
-------------------------------------- */

function IconHomeSidebar() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M3 9L9 3L15 9V15H3V9Z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M5 5L1 9L5 13" />
      <path d="M13 5L17 9L13 13" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="9" cy="6" r="3" />
      <path d="M2 15C2.5 12 5.5 10 9 10C12.5 10 15.5 12 16 15" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x="4" y="8" width="10" height="8" rx="2" />
      <path d="M6 8V6A3 3 0 0 1 12 6V8" />
    </svg>
  );
}

function IconUsers(props?: any) {
  return (
    <svg
      width="18"
      height="18"
      {...props}
      stroke={props?.stroke || "white"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="7" cy="6" r="3" />
      <circle cx="13" cy="10" r="3" />
      <path d="M2 15C2.5 12 5.5 10 9 10" />
      <path d="M9 15C9.5 12 12.5 10 16 10" />
    </svg>
  );
}

function IconRegister() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="8" cy="7" r="3" />
      <path d="M2 16C2.5 12.5 5.5 10.5 8 10.5C8.5 10.5 9 10.5 9.5 10.6" />
      <path d="M14 5V9" />
      <path d="M12 7H16" />
    </svg>
  );
}

function IconBroadcast() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="9" cy="9" r="2" />
      <path d="M9 6V3" />
      <path d="M9 12V15" />
      <path d="M12 9H15" />
      <path d="M3 9H6" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M4 14L12 6L14 8L6 16H4V14Z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      width="18"
      height="18"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M7 4H3V16H7" />
      <path d="M10 12L14 9L10 6" />
      <path d="M14 9H7" />
    </svg>
  );
}

function IconHouse(props?: any) {
  return (
    <svg
      width="18"
      height="18"
      stroke={props?.stroke || "#EA6F36"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M3 9L9 3L15 9V15H3V9Z" />
    </svg>
  );
}

function IconHouseFill() {
  return (
    <svg width="22" height="22" fill="#EA6F36">
      <path d="M3 10L11 3L19 10V19H3V10Z" />
    </svg>
  );
}

function IconShield(props?: any) {
  return (
    <svg
      width="18"
      height="18"
      stroke={props?.stroke || "#3A8B7A"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M9 2L15 4V9C15 13 12 15.5 9 17C6 15.5 3 13 3 9V4L9 2Z" />
    </svg>
  );
}

function IconShieldFill() {
  return (
    <svg width="22" height="22" fill="#3A8B7A">
      <path d="M11 2L19 5V10C19 14.5 15.5 17.2 11 19C6.5 17.2 3 14.5 3 10V5L11 2Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M9 4V14" />
      <path d="M4 9H14" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="8" cy="8" r="5" />
      <path d="M12 12L16 16" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M3 5H15" />
      <path d="M7 10H15" />
      <path d="M11 15H15" />
    </svg>
  );
}

function IconView() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="9" cy="9" r="2.5" />
      <path d="M2 9C3.5 5.5 6 3.5 9 3.5C12 3.5 14.5 5.5 16 9C14.5 12.5 12 14.5 9 14.5C6 14.5 3.5 12.5 2 9Z" />
    </svg>
  );
}

function IconEditLine() {
  return (
    <svg
      width="18"
      height="18"
      stroke="#063C53"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M4 14L12 6L14 8L6 16H4V14Z" />
    </svg>
  );
}
