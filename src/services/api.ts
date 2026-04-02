export const registerDevice = async (data: any) => {
  const res = await fetch('https://seu-backend/devices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return res.json();
};