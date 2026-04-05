import { columns } from "@/pages/users/columns";
import { DataTable } from "@/pages/users/data-table";
import { getMockUsers } from "@/mocks/tableMocks";

export default function UsersPage() {
  const data = getMockUsers();
  return (
    <div className="">
      <div className="bg-secondary mb-8 rounded-md px-4 py-2">
        <h1 className="font-semibold">All Users</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
