import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const Document = {
  createFolder: async (name) => {
    return await fetch(`${API_BASE}/document/create-folder`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  moveToFolder: async (files, folderName) => {
    const data = {
      files: files.map((file) => ({
        from: file.folderName ? `${file.folderName}/${file.name}` : file.name,
        to: `${folderName}/${file.name}`,
      })),
    };

    return await fetch(`${API_BASE}/document/move-files`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  /**
   * Get paginated documents for a workspace with lazy loading support
   * @param {number} workspaceId - The workspace ID
   * @param {number} page - Page number (1-based, default: 1)
   * @param {number} limit - Documents per page (default: 50)
   * @param {string} sortBy - Sort field: 'recent' (default), 'name', 'size'
   * @param {string} filterType - Filter by document type (e.g., 'pdf', 'docx')
   * @returns {Promise<{documents: Array, total: number, page: number, pages: number, pageSize: number}>}
   */
  getForWorkspacePaginated: async (
    workspaceId,
    page = 1,
    limit = 50,
    sortBy = "recent",
    filterType = null
  ) => {
    const params = new URLSearchParams({
      page,
      limit,
      sortBy,
    });
    if (filterType) {
      params.append("filterType", filterType);
    }

    return await fetch(
      `${API_BASE}/workspace/${workspaceId}/documents?${params.toString()}`,
      {
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return {
          documents: [],
          total: 0,
          page: 1,
          pages: 0,
          pageSize: limit,
          error: e.message,
        };
      });
  },
};

export default Document;
