import jsPDF from "jspdf";
import type { ServiceEntry } from "@/hooks/useServiceEntries";

export const generatePDF = (entry: ServiceEntry) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("StitchTrack", 105, 20, { align: "center" });
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

  // Payment
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 20, 126);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Estimated Cost: ₹${Number(entry.estimated_cost).toLocaleString("en-IN")}`, 20, 134);
  doc.text(`Advance Paid: ₹${Number(entry.advance_paid).toLocaleString("en-IN")}`, 20, 140);
  const balance = Number(entry.estimated_cost) - Number(entry.advance_paid);
  doc.setFont("helvetica", "bold");
  doc.text(`Balance Due: ₹${balance.toLocaleString("en-IN")}`, 20, 148);

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 270, 190, 270);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", 105, 278, { align: "center" });

  doc.save(`${entry.service_id}-receipt.pdf`);
};
