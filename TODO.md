- [x] Center the avatar in the edit modal of officials board page by updating the CSS classes in src/components/Pages/Sharable/officialBoardPage.jsx
- [x] Remove edit icons and make Name and Contact fields always editable inputs in the modal of officialBoardPage.jsx
- [x] Replace validation alert with error modal specifying missing fields in officialBoardPage.jsx

# Task: Convert alert to modal in officialBoardPage

## Steps:
- [x] Step 1: Add state variables for success modal (showSuccessModal, successMessage).
- [x] Step 2: Update saveModal function to trigger success modal on success and error modal on failures instead of alerts.
- [x] Step 3: Add JSX for the success modal after the error modal in the return statement.
- [x] Step 4: Test the changes by running the dev server, navigating to the page, performing an update, and verifying the modal appears.

# Task: Replace delete profile with set default avatar in officialBoardPage

## Steps:
- [x] Step 1: Replace deleteOfficial function with setDefaultAvatar to reset avatar to null locally.
- [x] Step 2: Change button text from "Delete Profile" to "Set Default" and update onClick.
- [x] Step 3: Change button color from red to gray for neutral action.
- [ ] Step 4: Test set default: Open modal, click set default, verify avatar resets to default icon and success message appears.

# Task: Integrate crop image modal for avatar upload in officialBoardPage

## Steps:
- [x] Step 1: Add states for crop modal (showCropModal, imageSrc, croppedAreaPixels, crop).
- [x] Step 2: Update file input onChange to open crop modal with react-easy-crop.
- [x] Step 3: Implement CropModal JSX with Cropper component and getCroppedImg utility.
- [x] Step 4: On crop complete, set editAvatar to cropped base64, keep editAvatarFile, close modal.
- [ ] Step 5: Test upload: Select image, crop, save, verify cropped avatar uploads and previews correctly.
