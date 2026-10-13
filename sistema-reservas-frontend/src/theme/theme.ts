import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            light: '#2D6A4F',
            main: '#1B4332',
            dark: '#081C15',
            contrastText: '#FFFFFF',
        },
        secondary: {
            light: '#F5E6B3',
            main: '#D4AF37', // Sharper gold
            dark: '#AA8822',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F9F9F8',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A211D',
            secondary: '#5C6E64',
        },
        divider: '#EBE8E1',
        error: {
            main: '#D32F2F',
            light: '#FFEBEE',
        },
        warning: {
            main: '#F57C00',
            light: '#FFF3E0',
        },
        success: {
            main: '#2E7D32',
            light: '#E8F5E9',
        },
        info: {
            main: '#1976D2',
            light: '#E3F2FD',
        },
    },

    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
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
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
        },
        caption: {
            fontSize: '0.75rem',
        },
        overline: {
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
        },
    },

    shape: {
        borderRadius: 14,
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C5BFB4 transparent',
                    backgroundColor: '#F9F9F8',
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 10,
                    letterSpacing: '0.01em',
                    padding: '8px 20px',
                    transition: 'all 0.2s ease',
                },
                contained: {
                    boxShadow: '0 4px 12px rgba(27,67,50,0.12)',
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(27,67,50,0.2)',
                        transform: 'translateY(-1px)',
                    },
                },
                outlined: {
                    borderWidth: '1.5px',
                    '&:hover': {
                        borderWidth: '1.5px',
                        backgroundColor: 'rgba(27,67,50,0.04)',
                    },
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                    border: '1px solid #EBE8E1',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                },
                elevation2: {
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                },
                elevation3: {
                    boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
                },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: '1px solid #EBE8E1',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    borderBottom: '1px solid #EBE8E1',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    color: '#1A211D',
                },
            },
        },

        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.03)',
                    border: '1px solid #EBE8E1',
                },
            },
        },

        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        backgroundColor: '#F9F9F8',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#5C6E64',
                        borderBottom: '2px solid #EBE8E1',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                    },
                },
            },
        },

        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(27,67,50,0.02)',
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
                    borderColor: '#EBE8E1',
                    padding: '16px',
                },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: 8,
                },
                filledSuccess: {
                    backgroundColor: '#E8F5E9',
                    color: '#1B5E20',
                },
                filledError: {
                    backgroundColor: '#FFEBEE',
                    color: '#B71C1C',
                },
                filledWarning: {
                    backgroundColor: '#FFF3E0',
                    color: '#E65100',
                },
                filledInfo: {
                    backgroundColor: '#E3F2FD',
                    color: '#0D47A1',
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
                    borderRadius: 12,
                    backgroundColor: '#FAFAFA',
                    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        backgroundColor: '#FFFFFF',
                    },
                    '&.Mui-focused': {
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 2px 12px rgba(27,67,50,0.08)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '2px',
                    },
                },
            },
        },

        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: '0.9375rem',
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
                },
            },
        },

        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    paddingBottom: 12,
                },
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                },
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: '#EBE8E1',
                },
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    margin: '2px 8px',
                    transition: 'background-color 0.15s ease',
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    backgroundColor: '#1A211D',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
            },
        },

        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 14,
                    border: '1px solid #EBE8E1',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
                },
            },
        },
    },
});

export default theme;