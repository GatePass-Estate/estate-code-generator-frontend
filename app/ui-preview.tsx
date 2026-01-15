import EditRequestsPage from "./(protected)/admin/edit-requests";
import EditRequestDetailPage from "./(protected)/admin/edit-requests/[id]";

export default function UIPreview() {
  return (
    <>
      {/* Toggle between pages */}
      <EditRequestsPage />
      {/* <EditRequestDetailPage /> */}
    </>
  );
}
