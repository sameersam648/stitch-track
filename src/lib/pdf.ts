import jsPDF from "jspdf";
import type { ServiceEntry } from "@/hooks/useServiceEntries";
import QRCode from "qrcode";

export const generatePDF = async (entry: ServiceEntry, action: "download" | "view" = "download") => {
  const doc = new jsPDF();

  // Generate QR code data URL (encoding the service_id)
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(entry.service_id, {
      margin: 1,
      width: 150,
    });
  } catch (err) {
    console.error("Failed to generate QR Code", err);
  }

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("S R Sewing World Services", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sewing Machine Service Center", 105, 27, { align: "center" });

  // Line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Service ID
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Service ID: ${entry.service_id}`, 20, 42);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date(entry.created_at).toLocaleDateString("en-IN")}`, 20, 50);
  doc.text(`Status: ${entry.status.toUpperCase()}`, 20, 56);

  // QR Code (Placed on the right side)
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 140, 40, 40, 40);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN TO VERIFY", 160, 84, { align: "center" });
  }

  // Customer details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Details", 20, 70);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${entry.customer_name}`, 20, 78);
  doc.text(`Phone: ${entry.customer_phone}`, 20, 84);

  // Machine details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Machine Details", 20, 98);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Brand/Model: ${entry.machine_brand || "N/A"}`, 20, 106);
  doc.text(`Problem: ${entry.problem_description || "N/A"}`, 20, 112);
  doc.text(`Unit: ${entry.unit === "unit_2" ? "Unit 2" : "Unit 1"}`, 20, 118);

  // Payment
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 20, 132);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Estimated Cost: ₹${Number(entry.estimated_cost).toLocaleString("en-IN")}`, 20, 140);

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 270, 190, 270);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", 105, 278, { align: "center" });

  if (action === "view") {
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(`${entry.service_id}-receipt.pdf`);
  }
};
