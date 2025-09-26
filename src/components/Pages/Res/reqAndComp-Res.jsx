import React, { useState, useEffect } from 'react';
import { Upload, Send, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import useSocket from '../../../hooks/useSocket';

const ReqAndCompRes = () => {
  const [viewMode, setViewMode] = useState('submit'); // 'submit' or 'view'

  // State for submission form
  const [category, setCategory] = useState('Complaint');
  const [files, setFiles] = useState([]);
  const [textFieldValue, setTextFieldValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // State for viewing submitted requests
  const [submittedData, setSubmittedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // File preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (viewMode === 'view') {
      fetchSubmittedData();
    }
  }, [viewMode]);

  // Socket.io integration for real-time updates
  const handleNewRequest = (newRequest) => {
    console.log('Received new request/complaint via socket:', newRequest);
    const currentUserId = localStorage.getItem('userId');

    // Only process if the request belongs to current user
    if (newRequest.acc_id == currentUserId) {
      console.log('Updating data for current user');

      // If we're in view mode, update the state immediately
      if (viewMode === 'view') {
        setSubmittedData((prev) => {
          // Check if item already exists to avoid duplicates
          const exists = prev.some(item => item.comreq_id === newRequest.comreq_id);
          if (exists) {
            console.log('Item already exists, skipping duplicate');
            return prev;
          }
          return [newRequest, ...prev];
        });
      } else {
        // If not in view mode, just log that we received new data
        console.log('New data received but not in view mode, will refresh when switching to view');
      }

      // Always refresh data from server to ensure consistency
      if (viewMode === 'view') {
        setTimeout(() => {
          fetchSubmittedData();
        }, 1000); // Small delay to ensure server has processed the data
      }
    }
  };

  const eventHandlers = {
    new_request: handleNewRequest,
    new_complaint: handleNewRequest,
  };

  const socket = useSocket(eventHandlers);

  const fetchSubmittedData = async () => {
    setLoading(true);
    setError(null);
    const acc_id = localStorage.getItem('userId');
    try {
      const response = await fetch(`https://villagelink.site/backend/api/compreq/get_comreq_logs.php?acc_id=${acc_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        // Filter data to only show submissions by the logged-in user
        const filteredData = result.data.filter(item => item.acc_id == acc_id);
        setSubmittedData(filteredData);
      } else {
        throw new Error(result.message || 'Failed to fetch submitted requests');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleTextFieldChange = (e) => {
    setTextFieldValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!textFieldValue || !category) {
      alert("Please fill in all fields.");
      return;
    }

    const acc_id = localStorage.getItem('userId');
    console.log("Submitting request with data:", {
      acc_id: acc_id,
      category,
      content: textFieldValue,
      files,
    });

    const formData = new FormData();
    formData.append("acc_id", acc_id);
    formData.append("category", category);
    formData.append("content", textFieldValue);

    files.forEach((file) => {
      formData.append("files[]", file);
    });

    try {
      const response = await fetch("https://villagelink.site/backend/api/compreq/save_comreq.php", {
        method: "POST",
        body: formData,
      });

      const rawResponse = await response.text();
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Raw response:", rawResponse);

      if (rawResponse.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON:\n" + rawResponse);
      }

      let result;
      try {
        result = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid JSON from backend:\n" + rawResponse);
      }

      if (result.status === "success") {
        setIsSubmitted(true);
        setTextFieldValue("");
        setFiles([]);

        // Emit socket event for real-time updates
        const newItem = {
          acc_id: acc_id,
          category: category,
          content: textFieldValue,
          status: 'Pending',
          created_at: new Date().toISOString(),
          comreqs_upload: files.map(f => f.name).join(',') || null
        };

        console.log('Emitting new_' + category.toLowerCase() + ' event:', newItem);
        // Fix event name for complaints to singular 'new_complaint'
        const eventName = category.toLowerCase() === 'complaint' ? 'new_complaint' : 'new_request';
        socket.emit(eventName, newItem);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Something went wrong.");
    }
  };

  // File preview functions
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'wmv':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getFileName = (filePath) => {
    return filePath.split('/').pop();
  };

  const getFileType = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };

  const isImage = (fileName) => {
    const extension = getFileType(fileName);
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const isVideo = (fileName) => {
    const extension = getFileType(fileName);
    return ['mp4', 'mov', 'avi', 'wmv'].includes(extension);
  };

  const isDocument = (fileName) => {
    const extension = getFileType(fileName);
    return ['pdf', 'doc', 'docx'].includes(extension);
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  const FileContainer = ({ files }) => {
    if (files.length === 0) {
      return (
        <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 flex flex-col items-center justify-center h-48 sm:h-64">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-sm text-center">No files submitted</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Submitted Files ({files.length})
        </h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {getFileIcon(file)}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(file)}
                </p>
                <p className="text-xs text-gray-500">
                  {file.includes('comreqs_upload/') ? 'Submitted by resident' : 'System file'}
                </p>
              </div>
              {isImage(file) || isVideo(file) || isDocument(file) ? (
                <button
                  onClick={() => handlePreview(file)}
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition duration-200"
                >
                  Preview
                </button>
              ) : (
                <a 
                  href={`https://villagelink.site/backend/comreqs_upload/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition duration-200"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 mr-1" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'Canceled': return <XCircle className="w-4 h-4 mr-1" />;
      default: return <Clock className="w-4 h-4 mr-1" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl sm:text-5xl font-bold text-blue-950 mb-4 ">
          Requests & Complaints
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Submit your requests or complaints to the HOA Office
        </p>
        
        {/* Mode Toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('submit')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center ${
              viewMode === 'submit' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit New
          </button>
          <button
            onClick={() => setViewMode('view')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center ${
              viewMode === 'view' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            My Submissions
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {viewMode === 'submit' ? (
          isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Submission Successful!</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Your {category.toLowerCase()} has been submitted successfully and is now under review.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-8 py-3 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  Type of Submission
                </label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-gray-50 hover:bg-white transition-colors duration-200"
                >
                  <option value="Complaint">Complaint</option>
                  <option value="Request">Request</option>
                </select>
              </div>

              {/* Text Field */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  {category === 'Complaint' ? 'Complaint Details' : 'Request Details'}
                </label>
                <textarea
                  value={textFieldValue}
                  onChange={handleTextFieldChange}
                  placeholder={`Please describe your ${category.toLowerCase()} in detail...`}
                  rows={8}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-gray-50 hover:bg-white transition-colors duration-200 resize-none"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  Attachments (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-70 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200 p-6">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-12 h-12 mb-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-600 mb-2">
                        Click to upload files
                      </p>
                      <p className="text-sm text-gray-500 text-center">
                        Supported formats: PDF, JPG, PNG, MP4, DOC<br />
                        Maximum file size: 10MB each
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.avi,.wmv,.doc,.docx"
                    />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Selected files:</p>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center text-sm text-blue-700 bg-white rounded-lg p-3 shadow-sm">
                          <FileText className="w-4 h-4 mr-2" />
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 px-4 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-3" />
                Submit {category}
              </button>
            </form>
          )
        ) : (
          <div>
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg">Loading your submissions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-2xl">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Submissions</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : submittedData.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">You haven't submitted any requests or complaints yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" />
                  My Submissions ({submittedData.length})
                </h2>
                
                <div className="grid gap-6">
                  {submittedData.map((item) => (
                    <div key={item.comreq_id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            item.category === 'Complaints' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {item.category === 'Complaints' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {item.category.toLowerCase()}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
                          </div>
                        </div>
                        <div className={`mt-3 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                          <span className="flex items-center">
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>

                      {/* Files */}
                      {item.comreqs_upload && (
                        <div className="mb-4">
                          <FileContainer files={item.comreqs_upload.split(',')} />
                        </div>
                      )}

                      {/* Remarks */}
                      {item.remarks && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Admin Remarks
                          </h4>
                          <p className="text-sm text-yellow-700">{item.remarks}</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">

                        <div className="text-sm text-gray-500">
                          Submitted: {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
         {/* File Preview Modal */}
    {showPreview && previewFile && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
        <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-[720px] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{getFileName(previewFile)}</h3>
            <button
              onClick={closePreview}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-auto max-h-[70vh]">
            {isImage(previewFile) && (
              <img
                src={`https://villagelink.site/backend/api/${previewFile}`}
                alt={getFileName(previewFile)}
                className="max-w-full max-h-[60vh] mx-auto object-contain"
              />
            )}
            {isVideo(previewFile) && (
              <video
                src={`https://villagelink.site/backend/api/${previewFile}`}
                controls
                className="max-w-full max-h-[60vh] mx-auto"
              >
                Your browser does not support the video tag.
              </video>
            )}
            {isDocument(previewFile) && (
              <div className="flex flex-col items-center">
                <iframe
                  src={`https://villagelink.site/backend/api/${previewFile}`}
                  className="w-full h-[60vh]"
                  title={getFileName(previewFile)}
                />
                <a
                  href={`https://villagelink.site/backend/api/${previewFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
        </div>
    </div>

  );
};

export default ReqAndCompRes;
