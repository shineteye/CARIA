import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Explore Careers", Icon: IcoTrend, path: "/explore" },
  { label: "AI Advisor", Icon: IcoBot, path: "/chat" },
];

export default function AppSidebar({
  activeItem,
  user = { name: "Kofi Mensah", role: "JHS 3 Student", initials: "KM" },
}) {
  const location = useLocation();

  const resolvedActive =
    activeItem ||
    NAV_ITEMS.find((n) => n.path === location.pathname)?.label ||
    "Explore Careers";

  return (
    <aside
      className="w-52 shrink-0 bg-white border-r border-border flex flex-col py-5 px-3 overflow-y-auto"
      style={{ minHeight: "100vh", fontFamily: "var(--font-body)" }}
    >
      <Link to="/" className="font-bold text-base text-navy px-3 mb-7 block">
        Caria <span className="text-gold">Ghana</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ label, Icon, path }) => {
          const isActive = label === resolvedActive;
          return (
            <Link
              key={label}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl  transition-all duration-150 ${
                isActive
                  ? "bg-gold text-white font-semibold"
                  : "text-fg-soft hover:bg-cream hover:text-navy"
              }`}
            >
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                <Icon color={isActive ? "white" : "currentColor"} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-border flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl  text-fg-soft hover:bg-cream hover:text-navy transition-all w-full">
          <span className="w-4 h-4 shrink-0 flex items-center justify-center">
            <IcoGear color="currentColor" />
          </span>
          Settings
        </button>

        <button className="flex items-center gap-3 px-3 py-2 rounded-xl  text-fg-soft hover:bg-cream hover:text-navy transition-all w-full">
          <span className="w-4 h-4 shrink-0 flex items-center justify-center">
            <IcoHelp color="currentColor" />
          </span>
          Help Center
        </button>

        <div className="flex items-center gap-2.5 px-2 pt-3 mt-1 border-t border-border">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-navy shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className=" font-semibold text-navy truncate">{user.name}</p>
            <p className="text-[11px] text-fg-muted truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function IcoTrend({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polyline
        points="22 7 13.5 15.5 8.5 10.5 2 17"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="16 7 22 7 22 13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoBot({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="8"
        width="18"
        height="13"
        rx="3"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M8 8V6a4 4 0 0 1 8 0v2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="14" r="1.5" fill={color} />
      <circle cx="15" cy="14" r="1.5" fill={color} />
      <path
        d="M9 18h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoGear({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoHelp({ color = "currentColor" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="17"
        r="0.5"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}
