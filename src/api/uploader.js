export async function uploadImage(file) {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET);

  return fetch(import.meta.env.VITE_CLOUDINARY_URL, {
    method: 'POST',
    body: data,
  }).
      then((response) => response.json()).
      then((data) => data.url).
      catch((error) => console.error(error));

}
