// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Menu } from "lucide-react";

// export default function Navbar() {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="relative">
//       {/* Hamburger Button */}
//       <AnimatePresence>
//         {!open && (
//           <motion.button
//             key="menu-button"
//             initial={{ y: -50, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.5 }}
//             onClick={() => setOpen(true)}
//             className="p-2 bg-purple-600 text-white rounded-full shadow-lg fixed top-4 left-4 z-50"
//           >
//             <Menu size={24} />
//           </motion.button>
//         )}
//       </AnimatePresence>

//       {/* Side Menu */}
//       <AnimatePresence>
//         {open && (
//           <motion.div
//             key="menu"
//             initial={{ x: "-100%", opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: "-100%", opacity: 0 }}
//             transition={{ duration: 0.6 }}
//             className="fixed top-0 left-0 w-64 h-full bg-purple-700 text-white shadow-lg z-40 p-6 flex flex-col gap-6"
//           >
//             {/* Close Button that slides down first */}
//             <motion.button
//               initial={{ y: -50, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               transition={{ duration: 0.5 }}
//               onClick={() => setOpen(false)}
//               className="p-2 bg-white text-purple-700 rounded-full shadow-lg self-start"
//             >
//               ✕
//             </motion.button>

//             <nav className="mt-8 flex flex-col gap-4">
//               <a href="/Homepage" className="hover:underline">Home</a>
//               <a href="/About" className="hover:underline">About</a>
//               <a href="/Contact" className="hover:underline">Contact</a>
//             </nav>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
