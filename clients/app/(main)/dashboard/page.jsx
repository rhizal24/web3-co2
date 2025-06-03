"use client";
import {
  fetchAllDocuments,
  checkDocumentIdExists,
  addDocument,
  deleteDocument,
  fetchDocumentById,
} from "@/lib/query/documents";
import { fetchDocumentContributors } from "@/lib/query/access";
import { addDocumentContributor } from "@/lib/query/access";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useMemo } from "react"; // Tambahkan useMemo
import ButtonAdd from "@/components/ButtonAddDoc";
import Loading from "@/components/Loading";
import SearchBox from "@/components/SearchBox";
import DashboardItem from "@/components/DashboardItem";
import { AuthContext } from "@/components/AuthProvider";

export default function Home() {
  const router = useRouter();
  // State untuk modal tambah dokumen
  const [openModal, setOpenModal] = useState(false);
  const [documents, setDocuments] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [judul, setJudul] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian

  // State untuk modal delete dokumen
  const [deleteModal, setDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State untuk modal detail dokumen
  const [detailModal, setDetailModal] = useState(false);
  const [documentDetail, setDocumentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contributors, setContributors] = useState([]);

  // Get the getCurrentUser function from context
  const { getCurrentUser } = useContext(AuthContext);

  // Generate a random 5-digit document ID
  const generateUniqueDocId = async () => {
    // Keep trying until we find an unused ID
    let isUnique = false;
    let newDocId;

    while (!isUnique) {
      // Generate a 5-digit number (10000-99999)
      const randomDigits = Math.floor(10000 + Math.random() * 90000);

      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      newDocId = `${year}${month}${day}-${randomDigits}`;

      // Check if this ID already exists
      const { exists, error } = await checkDocumentIdExists(newDocId);

      if (!error && !exists) {
        isUnique = true;
      }
    }

    return newDocId;
  };

  // Fungsi untuk menambah dokumen
  const handleAddDocument = async () => {
    if (!judul.trim()) {
      alert("Judul tidak boleh kosong!");
      return;
    }

    setLoading(true);
    try {
      const userData = await getCurrentUser();
      if (userData.status !== "success") {
        alert("User tidak ditemukan!");
        setLoading(false);
        return;
      }

      // Generate a unique document ID
      const uniqueDocId = await generateUniqueDocId();

      // Add the document with our custom ID
      const { data, error } = await addDocument(judul, userData.userid, uniqueDocId);

      if (error) {
        console.error("Error adding document:", error);
        alert("Gagal menambahkan dokumen!");
        setLoading(false);
        return;
      }

      // Get the new document ID
      const newDocId = data[0].docid;

      // Add owner to access table (even though they're the owner, this makes queries easier)
      await addDocumentContributor(newDocId, userData.userid);

      // Update local state with the new document
      if (data && data[0]) {
        const newDoc = {
          id: data[0].docid,
          title: data[0].judul,
          isi: data[0].isi || "",
          createdAt: new Date(data[0].createtime).toISOString().split("T")[0],
          viewDoc: data[0].isi || "",
        };
        setDocuments((prev) => [newDoc, ...prev]);
      }

      // Reset form state
      setJudul("");
      setOpenModal(false);
      setLoading(false);

      // Redirect to the document view page
      router.push(`/dashboard/view?id=${newDocId}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan!");
      setLoading(false);
    }
  };

  // Fungsi untuk load documents dari database
  const loadDocuments = async () => {
    try {
      console.log("Memulai proses loadDocuments...");

      // Ambil data pengguna yang sedang login
      const user = await getCurrentUser();
      console.log("Data user dari getCurrentUser:", user);

      if (!user || !user.userid) {
        console.error("User not found or userid is missing");
        alert("User tidak ditemukan atau userid kosong.");
        return;
      }

      // Panggil fetchAllDocuments dengan ownerid
      const { data, error } = await fetchAllDocuments(user.userid);
      console.log("Hasil fetchAllDocuments:", { data, error });

      if (error) {
        console.error("Error fetching documents:", error);
        alert("Gagal memuat dokumen: " + error);
        return;
      }

      if (data) {
        const formattedDocs = data.map((doc) => ({
          id: doc.docid,
          title: doc.judul,
          isi: doc.isi || "",
          createdAt: new Date(doc.createtime).toISOString().split("T")[0],
          viewDoc: doc.isi || "",
        }));
        console.log("Formatted documents:", formattedDocs);
        setDocuments(formattedDocs);
      }
      setLoading(false);
    } catch (error) {
      console.error("Unexpected error in loadDocuments:", error);
      alert("Terjadi kesalahan tak terduga saat memuat dokumen.");
    }
  };

  // Fungsi untuk memulai proses delete (menampilkan popup konfirmasi)
  const handleDeleteDocument = async (docid) => {
    console.log("handleDeleteDocument called with docid:", docid);

    try {
      // Get current user
      const userData = await getCurrentUser();
      if (!userData || !userData.userid) {
        alert("User not found");
        return;
      }

      // Fetch document details to check ownership
      const { data: docData, error: docError } = await fetchDocumentById(docid);
      if (docError || !docData) {
        console.error("Error fetching document:", docError);
        alert("Failed to fetch document details");
        return;
      }

      // Check if current user is the owner
      const isOwner = docData.ownerid === userData.userid;

      // Find the document in local state for display purposes
      const localDoc = documents.find((doc) => doc.id === docid);

      if (!localDoc) {
        alert("Document not found in local state");
        return;
      }

      // Set document to delete with ownership info
      setDocumentToDelete({
        ...localDoc,
        isOwner: isOwner,
        ownerid: docData.ownerid, // Include actual ownerid from database
      });

      setDeleteModal(true);
    } catch (error) {
      console.error("Error in handleDeleteDocument:", error);
      alert("An error occurred while checking document ownership");
    }
  };

  // Fungsi untuk konfirmasi delete
  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    setDeleteLoading(true);
    try {
      console.log("Menghapus dokumen dengan ID:", documentToDelete.id);

      // Dapatkan data user untuk ownerid
      const userData = await getCurrentUser();
      if (userData.status !== "success") {
        alert("User tidak ditemukan!");
        setDeleteLoading(false);
        return;
      }

      // Debug: cek nilai yang akan dikirim
      console.log("Mengirim ke deleteDocument:", {
        docid: documentToDelete.id,
        ownerid: userData.userid,
      });

      // Panggil deleteDocument dengan docid dan ownerid
      const result = await deleteDocument(documentToDelete.id, userData.userid);
      console.log("Hasil deleteDocument:", result);

      if (result.error) {
        console.error("Error deleting document:", result.error);
        alert("Gagal menghapus dokumen: " + (result.error.message || result.error));
        setDeleteLoading(false);
        return;
      }

      console.log("Dokumen berhasil dihapus dari database.");

      // Hapus dokumen dari state
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));

      // Reset state dan tutup modal
      setDeleteModal(false);
      setDocumentToDelete(null);
      setDeleteLoading(false);

      alert("Dokumen berhasil dihapus.");
    } catch (error) {
      console.error("Unexpected error deleting document:", error);
      alert("Terjadi kesalahan saat menghapus dokumen: " + error.message);
      setDeleteLoading(false);
    }
  };

  // Fungsi untuk membatalkan delete
  const cancelDelete = () => {
    setDeleteModal(false);
    setDocumentToDelete(null);
    setDeleteLoading(false);
  };

  // Fungsi untuk menampilkan detail document
  const handleViewDocument = async (docid) => {
    setDetailLoading(true);
    setDetailModal(true);

    try {
      // Fetch document detail
      const { data: docData, error: docError } = await fetchDocumentById(docid);
      if (docError) {
        console.error("Error fetching document detail:", docError);
        alert("Gagal memuat detail dokumen!");
        setDetailModal(false);
        setDetailLoading(false);
        return;
      }

      // Get current user to check if they're the owner
      const userData = await getCurrentUser();

      // Fetch contributors - pass the ownerid from document data
      const { data: contributorsData, error: contributorsError } = await fetchDocumentContributors(
        docid,
        docData.ownerid, // Pass the ownerid from the document data
      );

      if (contributorsError) {
        console.error("Error fetching contributors:", contributorsError);
        setContributors([]);
      } else {
        setContributors(contributorsData || []);
      }

      setDocumentDetail(docData);
      setDetailLoading(false);
    } catch (error) {
      console.error("Unexpected error fetching document detail:", error);
      alert("Terjadi kesalahan saat memuat detail dokumen!");
      setDetailModal(false);
      setDetailLoading(false);
    }
  };

  // Fungsi untuk menutup modal detail
  const closeDetailModal = () => {
    setDetailModal(false);
    setDocumentDetail(null);
    setContributors([]);
    setDetailLoading(false);
  };

  // HanddleEdit Document
  const handleEditDocument = (docid) => {
    // Redirect ke halaman edit dengan ID dokumen
    router.push(`/dashboard/view?id=${docid}`);
  };

  // Format tanggal untuk ditampilkan
  const formatDate = (dateString) => {
    if (!dateString) return "Tidak tersedia";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Format tanggal tidak valid";
    }
  };

  // Filter documents berdasarkan search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;

    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.isi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [documents, searchQuery]);

  // Load documents saat component mount
  useEffect(() => {
    loadDocuments(); // uncomment jika ingin load dari database
  }, []);

  return (
    <>
      <div className="relatify-ceactive flex h-full w-full flex-col items-center justify-center gap-4 pt-14">
        <div className="flex w-[90%] items-start justify-between">
          <ButtonAdd onClick={() => setOpenModal(true)}>Tambahkan</ButtonAdd>
        </div>
        <div className="relative flex h-[75%] w-[90%] flex-col gap-[12px] rounded-[15px] border-[1.5px] border-[#16223B] bg-white/20 px-3 py-3 backdrop-blur-lg">
          {/* Search Box */}

          <div className="flex w-full items-center justify-between">
            <span className="font-eudoxus-medium text-md text-[#16223B] md:text-xl">
              Daftar Dokumen
            </span>
            <SearchBox value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {loading && <Loading />}
          {/* Dashboard Item */}
          <div className="scrollbar-thin scrollbar-thumb-[#16223B]/70 scrollbar-track-[#16223B]/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full flex flex-col gap-4 overflow-y-auto pr-3">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((item) => (
                <DashboardItem
                  key={item.id}
                  title={item.title}
                  createdAt={item.createdAt}
                  viewDoc={item.isi}
                  onDelete={() => handleDeleteDocument(item.id)}
                  onEdit={() => handleEditDocument(item.id)}
                  onView={() => handleViewDocument(item.id)}
                  docid={item.id}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#16223B]/70">
                  {!loading &&
                    (searchQuery
                      ? "Tidak ada dokumen yang cocok dengan pencarian"
                      : "Tidak ada dokumen")}
                  {}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Popup Tambah Dokumen */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-md rounded-[15px] border-[1.5px] border-[#16223B] bg-white p-6 shadow-lg">
              {/* Header Modal */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-eudoxus-medium text-lg text-[#16223B]">Tambah Dokumen Baru</h2>
                <button
                  onClick={() => {
                    setOpenModal(false);
                    setJudul("");
                  }}
                  className="text-2xl text-[#16223B] transition-colors hover:text-red-500"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

              {/* Form Input */}
              <div className="mb-6">
                <label className="font-eudoxus-medium mb-2 block text-sm text-[#16223B]">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul dokumen..."
                  className="w-full rounded-lg border-[1.5px] border-[#16223B]/30 px-3 py-2 text-[#16223B] placeholder-[#16223B]/50 focus:border-[#16223B] focus:outline-none"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleAddDocument();
                    }
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOpenModal(false);
                    setJudul("");
                  }}
                  className="flex-1 rounded-lg border-[1.5px] border-[#16223B]/30 py-2 text-[#16223B] transition-colors hover:bg-[#16223B]/10"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleAddDocument}
                  disabled={loading || !judul.trim()}
                  className="flex-1 rounded-lg bg-[#16223B] py-2 text-white transition-colors hover:bg-[#16223B]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModal && documentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-md rounded-[15px] border-[1.5px] border-[#16223B] bg-white p-6 shadow-lg">
              {/* Header Modal */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-eudoxus-medium text-lg text-[#16223B]">
                  {documentToDelete.isOwner ? "Konfirmasi Hapus Dokumen" : "Akses Ditolak"}
                </h2>
                <button
                  onClick={cancelDelete}
                  className="text-2xl text-[#16223B] transition-colors hover:text-red-500"
                  disabled={deleteLoading}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                {documentToDelete.isOwner ? (
                  <>
                    <p className="font-eudoxus-medium mb-2 text-sm text-[#16223B]">
                      Apakah Anda yakin ingin menghapus dokumen ini?
                    </p>
                    <div className="rounded-lg border-[1.5px] border-[#16223B]/20 bg-[#16223B]/5 p-3">
                      <p className="font-eudoxus-medium text-sm text-[#16223B]">
                        <strong>Judul:</strong> {documentToDelete.title}
                      </p>
                      <p className="font-eudoxus-regular mt-1 text-xs text-[#16223B]/70">
                        <strong>ID Dokumen:</strong> {documentToDelete.id}
                      </p>
                    </div>
                    <p className="font-eudoxus-regular mt-2 text-xs text-red-600">
                      ⚠️ Tindakan ini akan menghapus dokumen secara permanen!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-center">
                      <svg
                        className="h-12 w-12 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <p className="font-eudoxus-medium mb-3 text-center text-sm text-[#16223B]">
                      Hanya pemilik dokumen yang dapat menghapusnya
                    </p>
                    <div className="rounded-lg border-[1.5px] border-[#16223B]/20 bg-[#16223B]/5 p-3">
                      <p className="font-eudoxus-medium text-sm text-[#16223B]">
                        <strong>Judul:</strong> {documentToDelete.title}
                      </p>
                      <p className="font-eudoxus-regular mt-1 text-xs text-[#16223B]/70">
                        <strong>ID Dokumen:</strong> {documentToDelete.id}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 rounded-lg border-[1.5px] border-[#16223B]/30 py-2 text-[#16223B] transition-colors hover:bg-[#16223B]/10"
                >
                  {documentToDelete.isOwner ? "Batal" : "Tutup"}
                </button>

                {documentToDelete.isOwner && (
                  <button
                    onClick={confirmDeleteDocument}
                    disabled={deleteLoading}
                    className="flex-1 rounded-lg bg-red-500 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Document Modal */}
        {detailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-[90%] max-w-2xl overflow-y-auto rounded-[15px] border-[1.5px] border-[#16223B] bg-white p-6 shadow-lg">
              {/* Header Modal */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-eudoxus-medium text-lg text-[#16223B]">Detail Dokumen</h2>
                <button
                  onClick={closeDetailModal}
                  className="text-2xl text-[#16223B] transition-colors hover:text-red-500"
                  disabled={detailLoading}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#16223B]"></div>
                  <span className="ml-3 text-[#16223B]">Memuat detail dokumen...</span>
                </div>
              ) : documentDetail ? (
                <div className="space-y-4">
                  {/* Document Info */}
                  <div className="rounded-lg border-[1.5px] border-[#16223B]/20 bg-[#16223B]/5 p-4">
                    <h3 className="font-eudoxus-medium mb-3 text-lg text-[#16223B]">
                      Informasi Dokumen
                    </h3>

                    <div className="grid gap-3">
                      <div>
                        <span className="font-eudoxus-medium text-sm text-[#16223B]">
                          ID Dokumen:
                        </span>
                        <p className="font-eudoxus-regular mt-1 text-sm text-[#16223B]/80">
                          {documentDetail.docid}
                        </p>
                      </div>

                      <div>
                        <span className="font-eudoxus-medium text-sm text-[#16223B]">Judul:</span>
                        <p className="font-eudoxus-regular mt-1 text-sm text-[#16223B]/80">
                          {documentDetail.judul}
                        </p>
                      </div>

                      <div>
                        <span className="font-eudoxus-medium text-sm text-[#16223B]">Dibuat:</span>
                        <p className="font-eudoxus-regular mt-1 text-sm text-[#16223B]/80">
                          {formatDate(documentDetail.createtime)}
                        </p>
                      </div>

                      <div>
                        <span className="font-eudoxus-medium text-sm text-[#16223B]">
                          Terakhir Diedit:
                        </span>
                        <p className="font-eudoxus-regular mt-1 text-sm text-[#16223B]/80">
                          {documentDetail.edittime
                            ? formatDate(documentDetail.edittime)
                            : "Belum pernah diedit"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contributors Info */}
                  <div className="rounded-lg border-[1.5px] border-[#16223B]/20 bg-[#16223B]/5 p-4">
                    <h3 className="font-eudoxus-medium mb-3 text-lg text-[#16223B]">Kontributor</h3>

                    {contributors.length > 0 ? (
                      <div className="space-y-2">
                        {contributors.map((contributor, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg bg-white/50 p-3"
                          >
                            <div>
                              <p className="font-eudoxus-medium text-sm text-[#16223B]">
                                {contributor.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-eudoxus-regular text-xs text-[#16223B]/80">
                                {contributor.isOwner ? (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                    Owner
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                    Contributor
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-eudoxus-regular py-4 text-center text-sm text-[#16223B]/60">
                        Tidak ada data kontributor
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="font-eudoxus-regular text-sm text-[#16223B]/60">
                    Gagal memuat detail dokumen
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="rounded-lg bg-[#16223B] px-6 py-2 text-white transition-colors hover:bg-[#16223B]/90"
                  disabled={detailLoading}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
