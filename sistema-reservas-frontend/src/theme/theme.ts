import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            light: '#4CAF50',
            main: '#2E7D32',
            dark: '#1B5E20',
            contrastText: '#FFFFFF',
        },
        secondary: {
            light: '#F0E4BA',
            main: '#C9A84C',
            dark: '#A87B25',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F7F4EF',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1C2726',
            secondary: '#6B7B74',
        },
        divider: '#E5E0D8',
        error: {
            main: '#C62828',
        },
        warning: {
            main: '#E65100',
            light: '#FFF3E0',
        },
        success: {
            main: '#388E3C',
            light: '#E8F5E9',
        },
        info: {
            main: '#1565C0',
            light: '#E3F2FD',
        },
    },

    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        subtitle1: {
            fontWeight: 600,
        },
        body1: {
            fontSize: '0.9375rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
        caption: {
            fontSize: '0.75rem',
        },
        overline: {
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
        },
    },

    shape: {
        borderRadius: 12,
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C5BFB4 transparent',
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    letterSpacing: '0.01em',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    },
                },
                outlined: {
                    '&:hover': {
                        backgroundColor: 'rgba(46,125,50,0.04)',
                    },
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
                    border: '1px solid #ECEAE4',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
                },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    borderBottom: '1px solid #E5E0D8',
                    backgroundColor: '#FFFFFF',
                    color: '#1C2726',
                },
            },
        },

        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },

        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        backgroundColor: '#F7F4EF',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#6B7B74',
                        borderBottom: '2px solid #E5E0D8',
                    },
                },
            },
        },

        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#F8F7F4',
                    },
                    '&:last-child td, &:last-child th': {
                        border: 0,
                    },
                },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: '#ECEAE4',
                    padding: '12px 16px',
                },
                head: {
                    fontWeight: 700,
                },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: 6,
                },
            },
        },

        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                    },
                },
            },
        },

        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: '0.9rem',
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
                },
            },
        },

        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    paddingBottom: 8,
                },
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    fontSize: '0.875rem',
                },
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: '#E5E0D8',
                },
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 6,
                    fontSize: '0.78rem',
                },
            },
        },

        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    border: '1px solid #E5E0D8',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                },
            },
        },
    },
});

export default theme;