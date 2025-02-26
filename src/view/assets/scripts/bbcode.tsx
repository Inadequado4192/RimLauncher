import { Link, List, ListItem, Sheet, Table, Typography } from "@mui/material";
import React from "react";

const Rules = {
    b: {
        test: /\[b\](.*?)\[\/b\]/g,
        Component: ({ children }) => <Typography display="contents" fontWeight="bold">{children}</Typography>
    },
    i: {
        test: /\[i\](.*?)\[\/i\]/g,
        Component: ({ children }) => <Typography display="contents" fontStyle="italic">{children}</Typography>
    },
    u: {
        test: /\[u\](.*?)\[\/u\]/g,
        Component: ({ children }) => <Typography display="contents" sx={{ textDecoration: "underline" }}>{children}</Typography>
    },
    s: {
        test: /\[s\](.*?)\[\/s\]/g,
        Component: ({ children }) => <Typography display="contents" sx={{ textDecoration: "line-through" }}>{children}</Typography>
    },
    url: {
        test: /\[url=([^\]]+)\](.*?)\[\/url\]/g,
        Component: ({ children, groups: [href] }) => <Link href={href} display="contents" target="_blank" rel="noopener noreferrer">{children}</Link>
    },
    img: {
        test: /\[img\](.*?)\[\/img\]/g,
        Component: ({ children, groups: [src] }) => <img style={{ maxWidth: "100%" }} src={src} alt="BBCode Image" />
    },
    color: {
        test: /\[color=(.*?)\](.*?)\[\/color\]/g,
        Component: ({ children, groups: [color] }) => <Typography display="contents" sx={{ color }}>{children}</Typography>
    },
    size: {
        test: /\[size=(.*?)\](.*?)\[\/size\]/g,
        Component: ({ children, groups: [size] }) => <Typography display="contents" sx={{ fontSize: size }}>{children}</Typography>
    },
    quote: {
        test: /\[quote\](.*?)\[\/quote\]/gs,
        Component: ({ children }) => <Sheet variant="plain" color="success" sx={t => ({
            p: 2,
            borderRadius: 5,
            borderLeftStyle: "solid",
            borderLeftWidth: 5,
            borderLeftColor: t.palette.success
        })}>{children}</Sheet>
    },
    code: {
        test: /\[code\](.*?)\[\/code\]/gs,
        Component: ({ children }) => <Typography display="contents" component="code" sx={t => ({ background: t.palette.background.backdrop, py: .5, px: 1 })}>{children}</Typography>
    },
    list: {
        test: /\[list\](.*?)\[\/list\]/gs,
        Component: ({ children }) => <List variant="outlined">{children}</List>
    },
    li: {
        test: /\[\*\](.*?)(?=\[\*\]|$)/gs,
        Component: ({ children }) => <ListItem>{children}</ListItem>
    },
    table: {
        test: /\[table\](.*?)\[\/table\]/gs,
        Component: ({ children }) => <Table borderAxis="bothBetween" variant="outlined"><tbody>{children}</tbody></Table>
    },
    tr: {
        test: /\[tr\](.*?)\[\/tr\]/gs,
        Component: ({ children }) => <tr>{children}</tr>
    },
    td: {
        test: /\[td\](.*?)\[\/td\]/g,
        Component: ({ children }) => <td>{children}</td>
    },
    h1: {
        test: /\[h1\](.*?)\[\/h1\]/g,
        Component: ({ children }) => <Typography level="h1">{children}</Typography>
    },
    h2: {
        test: /\[h2\](.*?)\[\/h2\]/g,
        Component: ({ children }) => <Typography level="h2">{children}</Typography>
    },
    h3: {
        test: /\[h3\](.*?)\[\/h3\]/g,
        Component: ({ children }) => <Typography level="h3">{children}</Typography>
    }
} satisfies {
    [K in string]: {
        test: RegExp,
        Component: React.FC<{ children: React.ReactNode, groups: string[] }>
    }
};

type BBCodeProps = {
    text: string;
};

// Функція для парсингу BBCode рекурсивно
const parseBBCode = (text: string): React.ReactNode[] => {
    // Якщо немає тегів, просто повертаємо текст
    if (!text) return [text];

    const elements: React.ReactNode[] = [];
    let remainingText = text;
    let match;

    // Проходимо по кожному правилу (тегу)
    for (const [key, { test, Component }] of Object.entries(Rules)) {
        while ((match = test.exec(remainingText)) !== null) {
            // Додаємо текст до елементів перед знайденим тегом
            if (match.index > 0) {
                elements.push(remainingText.slice(0, match.index));
            }

            // Текст між тегами
            const innerText = match.at(-1)!;
            const parsedInnerText = parseBBCode(innerText); // Рекурсивно парсимо вкладений текст

            // Додаємо компонент з результатом вкладених тегів
            elements.push(<Component key={match.index} groups={match.slice(1)}>{parsedInnerText}</Component>);

            // Оновлюємо залишок тексту
            remainingText = remainingText.slice(match.index + match[0].length);
        }
    }

    // Додаємо залишок тексту після останнього тегу
    if (remainingText) {
        elements.push(remainingText);
    }

    return elements;
};

const BBCode: React.FC<BBCodeProps> = ({ text }) => {
    const parsedElements = parseBBCode(text);

    return <>{parsedElements}</>;
};

export default BBCode;
