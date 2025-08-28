export class ModuleManager {
  static modules = new Map();
  static moduleConfig = new Map();
  
  // Register new modules dynamically
  static registerModule(moduleName, moduleConfig) {
    this.modules.set(moduleName, moduleConfig);
    console.log(`✅ Module registered: ${moduleName}`);
  }
  
  // Enable/disable modules without restart
  static toggleModule(moduleName, enabled) {
    const module = this.modules.get(moduleName);
    if (module) {
      module.enabled = enabled;
      console.log(`🔄 Module ${moduleName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  // Get active modules only
  static getActiveModules() {
    return Array.from(this.modules.entries())
      .filter(([name, config]) => config.enabled)
      .map(([name, config]) => ({ name, ...config }));
  }
}

// Module configurations
export const MODULES = {
  STUDENT_MANAGEMENT: {
    name: 'Student Management',
    enabled: true,
    routes: ['/students', '/students/:id'],
    permissions: ['view_students', 'edit_students']
  },
  GRADE_MANAGEMENT: {
    name: 'Grade Management', 
    enabled: true,
    routes: ['/grades', '/courses/:id/grades'],
    permissions: ['view_grades', 'edit_grades']
  },
  ATTENDANCE_SYSTEM: {
    name: 'Attendance System',
    enabled: false, // Can be enabled later
    routes: ['/attendance', '/attendance/mark'],
    permissions: ['view_attendance', 'mark_attendance']
  }
};
