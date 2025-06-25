import { activities_icon, applications, applications_bg, cards_icon, chevron_right, help, help_bg, land, land_bg, landing, landing_bg, logout, notification, notification_bg, purchase, purchase_bg, requests, requests_bg, transactions, transactions_bg, transfer, transfer_bg, verification_map, verify, verify_bg } from "@/public/assets/Dashboard/Home";
import { ground_rent, land_transfer, land_usage, sub_division } from "@/public/assets/Dashboard/land application";
import { contract_agreement, contract_introduction, download, pdf, referral } from "@/public/assets/Dashboard/my-land";
import { map1, smartLease } from "@/public/assets/home";
import { land_owner } from "@/public/assets/verify-land";

export const DashboardLinks = [
    {
        heading: "MENU",
        links: [
            {
                icon: landing,
                icon_bg: landing_bg,
                title: 'Home',
                route: '/dashboard'
            },
            {
                icon: land,
                icon_bg: land_bg,
                title: 'My Land',
                route: '/dashboard/my-land'
            },
            {
                icon: applications,
                icon_bg: applications_bg,
                title: 'Land Applications',
                route: '/dashboard/land-application'
            },
            {
                icon: purchase,
                icon_bg: purchase_bg,
                title: 'Purchase a Land',
                route: '/dashboard/purchase-land'
            },
            {
                icon: verify,
                icon_bg: verify_bg,
                title: 'Verify Land',
                route: '/dashboard/land-verification'
            },
            {
                icon: transfer,
                icon_bg: transfer_bg,
                title: 'Land Transfer',
                route: '/dashboard/land-transfer'
            },
        ]
    }, 
    {
        heading: "OTHERS",
        links: [
            {
                icon: transactions,
                icon_bg: transactions_bg,
                title: 'Transactions',
                route: '/dashboard/transactions',
            },
            {
                icon: requests,
                icon_bg: requests_bg,
                title: 'Requests',
                route: '/dashboard/request',
            },
            {
                icon: notification,
                icon_bg: notification_bg,
                title: 'Notification',
                route: '/dashboard/notification',
            },
        ]
    },
    {
        links: [
            {
                icon: help,
                icon_bg: help_bg,
                title: 'Help Centre',
                route: '/dashboard/help-centre',
            },
            {
                icon: logout,
                icon_bg: logout,
                title: 'Logout',
                route: '/logout',
            },
        ]
    }
]

export const cards = [
    {
       title: 'Number of plot', 
       number: 5,
       icon: cards_icon
    },
    {
       title: 'Active Applications', 
       number: 3,
       icon: cards_icon
    },
    {
       title: 'All Request', 
       number: 5,
       icon: cards_icon
    },
    {
       title: 'Amount Paid', 
       number: '30,000',
       icon: cards_icon
    },
]

export const recentActivities = [
    {
        icons: activities_icon,
        title: 'Transfer ownership • 6 minutes ago',
        description: 'You submitted a land ownership transfer request for Plot0000001 to Svannah NGuyen'
    },
    {
        icons: activities_icon,
        title: 'Land application • 6 minutes ago',
        description: 'You applied for a plot in Akobo Estate Project'
    },
    {
        icons: activities_icon,
        title: 'Payment • 6 minutes ago',
        description: 'You paid ₦500.00 for sub division request (SBF26645533)'
    },
    {
        icons: activities_icon,
        title: 'Change of use request • 6 minutes ago',
        description: 'You requested a land change of use for Plot0000001 (Residential to Commercial)'
    },
    {
        icons: activities_icon,
        title: 'Sub-division request • 6 minutes ago',
        description: 'You requested a land sub division for Plot0000001'
    },
    {
        icons: activities_icon,
        title: 'Transfer ownership • 6 minutes ago',
        description: 'You submitted a land ownership transfer request for Plot0000001 to Svannah NGuyen'
    },
    {
        icons: activities_icon,
        title: 'Land application • 6 minutes ago',
        description: 'You applied for a plot in Akobo Estate Project'
    },
    {
        icons: activities_icon,
        title: 'Payment • 6 minutes ago',
        description: 'You paid ₦500.00 for sub division request (SBF26645533)'
    },
    {
        icons: activities_icon,
        title: 'Change of use request • 6 minutes ago',
        description: 'You requested a land change of use for Plot0000001 (Residential to Commercial)'
    },
    {
        icons: activities_icon,
        title: 'Sub-division request • 6 minutes ago',
        description: 'You requested a land sub division for Plot0000001'
    },   
]

export const plots = [
    {
        image: map1,
        plot: 'Plot 1A',
        area: 'Iwo area'
    },
    {
        image: map1,
        plot: 'Plot 2B',
        area: 'Iwo area'
    },
    {
        image: map1,
        plot: '17C',
        area: 'Abeokuta'
    },
]

export const quickActions = [
    {
        title: 'Pay Groundrent',
        icon: chevron_right
    },
    {
        title: 'Request Plot Division',
        icon: chevron_right
    },
    {
        title: 'Request Change Of Land Usage',
        icon: chevron_right
    },
    {
        title: 'Request Setback Almagamation',
        icon: chevron_right
    },
]

export const tabLinks = [
    "Land Overview",
    "Documentation",
    "Ground Rent",
    "Activities",
    "Payment History"
]
export const OpAreaLinks = [
    "Land Overview",
    "Documentation",
    "Activities",
    "Payment History"
]

export const documentations = [
    {
        image: contract_agreement,
        pdf: pdf,
        download: download,
        name: 'Contracts and Agreements.pdf',
        date: '12-06-2024 | 4:59 PM' 
    },
    {
        image: referral,
        pdf: pdf,
        download: download,
        name: 'Land Plan.pdf',
        date: '11-06-2024 | 4:59 PM' 
    },
    {
        image: contract_introduction,
        pdf: pdf,
        download: download,
        name: 'Project Plan.pdf',
        date: '10-06-2024 | 2:23 PM' 
    },
]

export const Groundrent = [
    {
        month: 'March 2024 - March 2025',
        payment: 'Due for payment',
        amount: '₦11,000.00 • Due on March 6, 2025'
    },
    {
        month: 'March 2023 - March 2024',
        payment: 'Due for payment',
        amount: '₦11,000.00 • Due on March 6, 2025'
    },
    {
        month: 'March 2022 - March 2023',
        payment: 'Due for payment',
        amount: '₦11,000.00 • Due on March 6, 2025'
    },
    {
        month: 'March 2021 - March 2022',
        payment: 'Paid',
        amount: '₦11,000.00 • Due on March 6, 2025'
    },
]

export const requestDetails = [
    {
        title: 'REQUEST ID',
        description: 'RST-0000000001'
    },
    {
        title: 'REQUEST TYPE',
        description: 'Land Transfer'
    },
    {
        title: 'REQUEST ID',
        description: '12 May 2024 | 10:20PM'
    },
]

export const activeApplications = [
    {
        address: 'Alafia Estate Ibadan',
        state: 'Oyo State',
        buttonText: 'Under consideration'
    },
    {
        address: 'FCT Central Market, Abuja',
        state: 'FCT',
        buttonText: 'Under consideration'
    },
    {
        address: 'Akobo Estate',
        state: 'Oyo State',
        buttonText: 'Approved'
    }
]

export const paymentHistory = [
    {
        icon: ground_rent,
        title: 'Annual ground payment for Plot0000001 (February 1, 2025 to February 1, 2026)',
        description: 'Groundrent • 6 minutes ago',
        price: '- ₦11,000.00'
    },
    {
        icon: land_transfer,
        title: 'Request fee for Plot0000001 ownership transfer to Svannah NGuyen ',
        description: 'Land transfer • 12:08PM',
        price: '- ₦11,000.00'
    },
    {
        icon: sub_division,
        title: 'Sub division request fee for Plot0000001',
        description: 'Plot sub division • 12:08PM',
        price: '- ₦11,000.00'
    },
    {
        icon: land_usage,
        title: 'Change usage request (Residential to Commercial) for Plot0000001',
        description: 'Land usage • 12:08PM',
        price: '- ₦11,000.00'
    },
]

export const requestLinks = [
    "All Requests",
    "Land Transfer",
    "Plot Division",
    "Setback Almagamation"
]

export const notificationLinks = [
    "All Activities",
    "System Based",
    "Land Transfer",
    "Plot Division",
    "Setback Almagamation"
]

export const request = [
    {
        icon: land_owner,
        title: 'Requested a plot transfer',
        desc: 'You requested a plot division',
        date: 'Mar 7 2025'
    },
    {
        icon: land_owner,
        title: 'Plot Division',
        desc: 'Adekunle Adebayo requested a plot transfer',
        date: 'Mar 5 2025'
    },
    {
        icon: land_owner,
        title: 'Set back Almagamation',
        desc: 'Adekunle Adebayo requested a plot transfer',
        date: 'Jan 1 2025'
    },
    {
        icon: land_owner,
        title: 'Requested a plot transfer',
        desc: 'You requested a plot division',
        date: 'Dec 20 2024'
    },
    {
        icon: land_owner,
        title: 'Requested a plot transfer',
        desc: 'You requested a plot division',
        date: 'Jan 7 2024'
    },
    {
        icon: land_owner,
        title: 'Land usage',
        desc: 'You requested a change of land usage',
        date: 'an 7 2024'
    },
]

export const Notifications = [
    {
        icons: land_transfer,
        title: 'Transfer ownership • 6 minutes ago',
        description: 'You submitted a land ownership transfer request for Plot0000001 to Svannah NGuyen'
    },
    {
        icons: activities_icon,
        title: 'Land application • 6 minutes ago',
        description: 'You applied for a plot in Akobo Estate Project'
    },
    {
        icons: ground_rent,
        title: 'Payment • 6 minutes ago',
        description: 'You paid ₦500.00 for sub division request (SBF26645533)'
    },
    {
        icons: land_usage,
        title: 'Change of use request • 6 minutes ago',
        description: 'You requested a land change of use for Plot0000001 (Residential to Commercial)'
    },
    {
        icons: sub_division,
        title: 'Sub-division request • 6 minutes ago',
        description: 'You requested a land sub division for Plot0000001'
    },
    {
        icons: land_transfer,
        title: 'Transfer ownership • 6 minutes ago',
        description: 'You submitted a land ownership transfer request for Plot0000001 to Svannah NGuyen'
    },
    {
        icons: activities_icon,
        title: 'Land application • 6 minutes ago',
        description: 'You applied for a plot in Akobo Estate Project'
    },
    {
        icons: ground_rent,
        title: 'Payment • 6 minutes ago',
        description: 'You paid ₦500.00 for sub division request (SBF26645533)'
    },
    {
        icons: land_usage,
        title: 'Change of use request • 6 minutes ago',
        description: 'You requested a land change of use for Plot0000001 (Residential to Commercial)'
    },
    {
        icons: sub_division,
        title: 'Sub-division request • 6 minutes ago',
        description: 'You requested a land sub division for Plot0000001'
    },   
    {
        icons: smartLease,
        title: 'Sub-division request • 6 minutes ago',
        description: 'You requested a land sub division for Plot0000001'
    },   
]


export const landAcquired = [
    {
        image: map1,
    },
    {
        image: map1,
    }
]
export const landTransferred = [
    {
        image: map1,
    },
    {
        image: map1,
    },
    {
        image: map1,
    }
]

export const singleLandLinks = [
    "Land Overview",
    "Activities"
]

export const landTransferLinks = [
    "Land acquired",
    "Land Transferred"
]

export const verificationHistory = [
    {
        map: verification_map,
    },
    {
        map: verification_map,
    },
    {
        map: verification_map,
    },
]