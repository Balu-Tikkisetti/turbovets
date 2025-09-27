import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DepartmentService } from '../../core/services/department.service';
import { StatisticsService } from '../../core/services/statistics.service';
import { TaskStatistics } from '@turbovets/data';

// Using TaskStatistics from @turbovets/data

@Component({
  selector: 'app-statistics-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './statistics-chart.component.html',
  styleUrls: ['./statistics-chart.component.scss']
})
export class StatisticsChartComponent implements OnInit, OnDestroy {
  @Input() chartType: ChartType = 'bar';
  @Input() title = 'Statistics Chart';
  @Input() dataType = 'department';
  
  private store = inject(Store);
  private departmentService = inject(DepartmentService);
  private statisticsService = inject(StatisticsService);
  private subscription = new Subscription();
  
  statisticsLoading = false;
  
  // Department data from database
  allDepartments: string[] = [];
  currentStatistics: TaskStatistics | null = null;
  
  chartData: ChartData = {
    labels: [],
    datasets: []
  };
  
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#0891B2',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11,
          weight: 'normal'
        },
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `Tasks: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: '#E5E7EB'
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'bold'
          },
          stepSize: 1,
          precision: 0
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  ngOnInit() {

    
    // Load departments from database first
    this.loadDepartments();
    
    // Load statistics directly from StatisticsService
    this.loadStatistics();
    
    // Set up polling for statistics updates (every 30 seconds)
    this.subscription.add(
      interval(30000).subscribe(() => {
        this.loadStatistics();
      })
    );
  }

  private loadDepartments() {
    this.departmentService.getDepartmentNames().subscribe({
      next: (departmentNames: string[]) => {
        this.allDepartments = departmentNames;

      },
      error: (error: unknown) => {
        console.error('Error loading department names:', error);
        // No fallback - let the chart handle empty departments
        this.allDepartments = [];
      }
    });
  }

  private loadStatistics() {

    this.statisticsLoading = true;
    
    this.statisticsService.getTaskStatistics().subscribe({
      next: (statistics: TaskStatistics) => {

        this.currentStatistics = statistics;
        this.updateChartData(statistics);
        this.statisticsLoading = false;
      },
      error: (error: unknown) => {
        console.error('Statistics Component: Error loading statistics:', error);
        this.statisticsLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateChartData(statistics: TaskStatistics) {

    
    let labels: string[] = [];
    let data: number[] = [];
    let backgroundColor: string[] = [];

    switch (this.dataType) {
      case 'department': {
        // Use departments from statistics data - this contains real departments from database
        const departmentData = statistics.tasksByDepartment || {};
       
        
        // Get all departments that have tasks
        const departmentNames = Object.keys(departmentData);

        
        if (departmentNames.length > 0) {
          // Use departments from statistics data (real departments from database)
          labels = departmentNames.map(dept => this.getShortDepartmentName(dept));
          data = departmentNames.map(dept => departmentData[dept] || 0);
        
        } else {
          // If no departments in data, show a message or use fallback
   
          labels = ['No Departments'];
          data = [0];
   
        }
        
        backgroundColor = this.getEnterpriseColors(labels.length);

        break;
      }
        
      case 'status':
        labels = Object.keys(statistics.tasksByStatus || {}).map(status => 
          status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
        );
        data = Object.values(statistics.tasksByStatus || {});
        backgroundColor = this.getStatusColors(Object.keys(statistics.tasksByStatus || {}));
        break;
        
      case 'priority':
        labels = Object.keys(statistics.tasksByPriority || {}).map(priority => 
          priority.charAt(0).toUpperCase() + priority.slice(1)
        );
        data = Object.values(statistics.tasksByPriority || {});
        backgroundColor = this.getPriorityColors(Object.keys(statistics.tasksByPriority || {}));
        break;
        
      case 'weekly':
        labels = this.getWeekLabels();
        data = this.getWeekData(statistics.weeklyTasks || {});
        backgroundColor = this.getWeeklyColors(data.length);
        break;
    }

    this.chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: backgroundColor,
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: backgroundColor.map(color => this.adjustBrightness(color, 10)),
      }]
    };
    

  }

  private getDepartmentColors(count: number): string[] {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    return colors.slice(0, count);
  }

  private getEnterpriseColors(count: number): string[] {
    // Generate dynamic colors for any number of departments
    const baseColors = [
      '#0891B2', // Teal
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#14B8A6', // Emerald
      '#F43F5E', // Rose
      '#8B5A2B', // Amber
      '#1E40AF', // Deep Blue
      '#059669', // Emerald Green
      '#DC2626', // Red
      '#7C3AED', // Purple
      '#EA580C', // Orange
      '#BE185D'  // Pink
    ];
    
    // If we need more colors than available, generate them dynamically
    if (count > baseColors.length) {
      const colors = [...baseColors];
      for (let i = baseColors.length; i < count; i++) {
        // Generate a color using HSL with different hues
        const hue = (i * 137.5) % 360; // Golden angle for good distribution
        const saturation = 70 + (i % 3) * 10; // Vary saturation slightly
        const lightness = 45 + (i % 2) * 10; // Vary lightness slightly
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
      return colors.slice(0, count);
    }
    
    return baseColors.slice(0, count);
  }

  private getStatusColors(statuses: string[]): string[] {
    const statusColorMap: { [key: string]: string } = {
      'to-do': '#6B7280',
      'in-progress': '#3B82F6',
      'ongoing': '#3B82F6',
      'started': '#3B82F6',
      'completed': '#10B981',
      'cancelled': '#EF4444'
    };
    
    return statuses.map(status => statusColorMap[status] || '#6B7280');
  }

  private getPriorityColors(priorities: string[]): string[] {
    const priorityColorMap: { [key: string]: string } = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#7C2D12'
    };
    
    return priorities.map(priority => priorityColorMap[priority] || '#6B7280');
  }

  private getWeeklyColors(count: number): string[] {
    return Array(count).fill('#0891B2'); // Teal color like in the image
  }

  private getWeekLabels(): string[] {
    const labels = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
    }
    
    return labels;
  }

  private getWeekData(weeklyTasks: { [day: string]: number }): number[] {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push(weeklyTasks[date.toISOString().split('T')[0]] || 0);
    }
    
    return data;
  }

  private adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  getDepartmentColor(department: string): string {
    // Use the same dynamic color system as the chart
    const colors = this.getEnterpriseColors(this.allDepartments.length);
    const index = this.allDepartments.indexOf(department);
    return colors[index] || '#6B7280';
  }


  getShortDepartmentName(department: string): string {
    // Take first two letters from department name and convert to uppercase
    return department.substring(0, 2).toUpperCase();
  }

}

