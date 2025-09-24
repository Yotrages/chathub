// import { invisibleStorage } from "@/libs/redux/invisibleIndexDBStore";
import { useState, useEffect } from "react";

export const useScreenSize = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isSmallScreen;
};

// export const useInvisibleStorageInfo = () => {
//   const [storageInfo, setStorageInfo] = useState({ totalItems: 0, totalSize: 0 });

//   useEffect(() => {
//     const updateStorageInfo = async () => {
//       const info = await invisibleStorage.getStorageInfo();
//       setStorageInfo(info);
//     };

//     updateStorageInfo();
//     const interval = setInterval(updateStorageInfo, 10000); // Update every 10 seconds

//     return () => clearInterval(interval);
//   }, []);

//   return {
//     ...storageInfo,
//     sizeInMB: (storageInfo.totalSize / (1024 * 1024)).toFixed(2),
//   };
// };

