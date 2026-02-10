export default function UserMetaCard() {
  const fallbackUser = {
    name: "Naod",
    email: "naod@example.com",
    position: "Team Lead",
    image: "https://avatars.githubusercontent.com/u/51057557?v=4",
  };
  const authUser = (() => {
    try {
      const rawUser = localStorage.getItem("authUser");
      return rawUser ? (JSON.parse(rawUser) as typeof fallbackUser) : null;
    } catch {
      return null;
    }
  })();
  const user = authUser ?? fallbackUser;
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="order-1">
            <img
              src={user.image ?? fallbackUser.image}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user.name}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.position}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
