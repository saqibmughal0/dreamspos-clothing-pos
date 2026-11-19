import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";
import { authenticate, requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const hrmRouter = Router();
hrmRouter.use(authenticate);

const hrmWriteRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER];

// --- DEPARTMENTS ---
hrmRouter.get("/departments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.department.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/departments", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, code, description, isActive } = req.body;
    if (!name) { res.status(400).json({ success: false, message: "Department name is required" }); return; }
    const created = await prisma.department.create({
      data: { companyId, name: String(name).trim(), code: code || null, description: description || null, isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/departments/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.department.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Department not found" }); return; }
    await prisma.department.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Department deleted" });
  } catch (err) { next(err); }
});

// --- DESIGNATIONS ---
hrmRouter.get("/designations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.designation.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/designations", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, description, isActive } = req.body;
    if (!name) { res.status(400).json({ success: false, message: "Designation name is required" }); return; }
    const created = await prisma.designation.create({
      data: { companyId, name: String(name).trim(), description: description || null, isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/designations/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.designation.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Designation not found" }); return; }
    await prisma.designation.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Designation deleted" });
  } catch (err) { next(err); }
});

// --- SHIFTS ---
hrmRouter.get("/shifts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.shift.findMany({ where: { companyId }, orderBy: { name: "asc" } });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/shifts", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, startTime, endTime, breakMinutes } = req.body;
    if (!name || !startTime || !endTime) { res.status(400).json({ success: false, message: "Shift name, startTime, and endTime are required" }); return; }
    const created = await prisma.shift.create({
      data: { companyId, name: String(name).trim(), startTime: String(startTime), endTime: String(endTime), breakMinutes: Number(breakMinutes || 0) }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/shifts/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.shift.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Shift not found" }); return; }
    await prisma.shift.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Shift deleted" });
  } catch (err) { next(err); }
});

// --- EMPLOYEES ---
hrmRouter.get("/employees", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.employee.findMany({
      where: { companyId },
      include: { department: true, designation: true, shift: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({
      success: true,
      data: {
        items: items.map(e => ({ ...e, basicSalary: Number(e.basicSalary) }))
      }
    });
  } catch (err) { next(err); }
});

hrmRouter.post("/employees", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { firstName, lastName, empCode, email, phone, departmentId, designationId, shiftId, basicSalary } = req.body;
    if (!firstName || !lastName) { res.status(400).json({ success: false, message: "First name and last name are required" }); return; }
    const created = await prisma.employee.create({
      data: {
        companyId,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        empCode: empCode ? String(empCode).trim().toUpperCase() : "EMP-" + Date.now().toString().slice(-5),
        email: email || null,
        phone: phone || null,
        departmentId: departmentId || null,
        designationId: designationId || null,
        shiftId: shiftId || null,
        basicSalary: Number(basicSalary || 0)
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/employees/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.employee.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Employee not found" }); return; }
    await prisma.employee.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) { next(err); }
});

// --- ATTENDANCE ---
hrmRouter.get("/attendance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.attendance.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: { date: "desc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/attendance", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { employeeId, date, clockIn, clockOut, status, notes } = req.body;
    if (!employeeId) { res.status(400).json({ success: false, message: "Employee is required" }); return; }
    const created = await prisma.attendance.create({
      data: {
        companyId,
        employeeId,
        date: date ? new Date(date) : new Date(),
        clockIn: clockIn ? new Date(clockIn) : new Date(),
        clockOut: clockOut ? new Date(clockOut) : null,
        status: status || "PRESENT",
        notes: notes || null
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

// --- LEAVE TYPES & LEAVES ---
hrmRouter.get("/leave-types", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.leaveType.findMany({ where: { companyId }, orderBy: { name: "asc" } });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/leave-types", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, daysAllowed, isPaid } = req.body;
    if (!name) { res.status(400).json({ success: false, message: "Leave type name is required" }); return; }
    const created = await prisma.leaveType.create({
      data: { companyId, name: String(name).trim(), daysAllowed: Number(daysAllowed || 12), isPaid: isPaid !== false }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/leave-types/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.leaveType.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Leave type not found" }); return; }
    await prisma.leaveType.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Leave type deleted" });
  } catch (err) { next(err); }
});

hrmRouter.get("/leaves", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.leaveRequest.findMany({
      where: { companyId },
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/leaves", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { employeeId, leaveTypeId, startDate, endDate, days, reason } = req.body;
    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      res.status(400).json({ success: false, message: "Employee, leave type, start date, and end date are required" });
      return;
    }
    const created = await prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: Number(days || 1),
        reason: reason || null
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.patch("/leaves/:id/status", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.leaveRequest.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Leave request not found" }); return; }
    const updated = await prisma.leaveRequest.update({
      where: { id: existing.id },
      data: { status: req.body.status || "APPROVED" }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// --- HOLIDAYS ---
hrmRouter.get("/holidays", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.holiday.findMany({ where: { companyId }, orderBy: { fromDate: "asc" } });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

hrmRouter.post("/holidays", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, fromDate, toDate, description } = req.body;
    if (!name || !fromDate || !toDate) { res.status(400).json({ success: false, message: "Name, fromDate, and toDate are required" }); return; }
    const created = await prisma.holiday.create({
      data: { companyId, name: String(name).trim(), fromDate: new Date(fromDate), toDate: new Date(toDate), description: description || null }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.delete("/holidays/:id", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.holiday.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Holiday not found" }); return; }
    await prisma.holiday.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Holiday deleted" });
  } catch (err) { next(err); }
});

// --- PAYROLL ---
hrmRouter.get("/payrolls", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.payroll.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    });
    res.json({
      success: true,
      data: {
        items: items.map(p => ({
          ...p,
          basicSalary: Number(p.basicSalary),
          allowances: Number(p.allowances),
          deductions: Number(p.deductions),
          netSalary: Number(p.netSalary)
        }))
      }
    });
  } catch (err) { next(err); }
});

hrmRouter.post("/payrolls", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { employeeId, month, year, basicSalary, allowances = 0, deductions = 0 } = req.body;
    if (!employeeId || !month || !year) { res.status(400).json({ success: false, message: "Employee, month, and year are required" }); return; }
    const basic = Number(basicSalary || 0);
    const allow = Number(allowances || 0);
    const ded = Number(deductions || 0);
    const net = Math.max(0, basic + allow - ded);
    const created = await prisma.payroll.create({
      data: { companyId, employeeId, month: Number(month), year: Number(year), basicSalary: basic, allowances: allow, deductions: ded, netSalary: net }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

hrmRouter.patch("/payrolls/:id/pay", requireRoles(hrmWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.payroll.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Payroll record not found" }); return; }
    const updated = await prisma.payroll.update({
      where: { id: existing.id },
      data: { status: "PAID", paidAt: new Date() }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});
