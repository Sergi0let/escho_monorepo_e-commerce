import { columns } from "@/pages/payments/columns";
import { DataTable } from "@/pages/payments/data-table";
import { getMockPayments } from "@/mocks/tableMocks";

export default function PaymentsPage() {
  const data = getMockPayments();
  return (
    <div className="">
      <div className="bg-secondary mb-8 rounded-md px-4 py-2">
        <h1 className="font-semibold">All Payments</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
