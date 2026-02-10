export default function UserInfoCard() {
  const fallbackUser = {
    name: "Naod",
    email: "naod@example.com",
    position: "Team Lead",
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
  const nameParts = user.name?.trim().split(" ") ?? [];
  const firstName = nameParts[0] ?? user.name;
  const lastName = nameParts.slice(1).join(" ");
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {firstName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {lastName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Bio
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.position}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
