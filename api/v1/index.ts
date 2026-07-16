import express, { Request, Response } from 'express';
import sharp from "sharp";
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);
const app = express();
const supabaseUrl = process.env.SUPABASE_URL


const JWT_SECRET = process.env.JWT_SECRET!;


app.use(express.json());

const WALLPAPERS: Record<string, string> = {
    classic: "https://smartford.vercel.app/wallpapers/classic/img1.png",
    winter: "https://smartford.vercel.app/wallpapers/winter/img1.png",
    default: "https://smartford.vercel.app/wallpapers/default/img1.png"
};




app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    try {
        const { username, name, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        
        const { data: existingUser } = await supabase
            .from('smartford_accounts')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        
        const { data, error } = await supabase
            .from('smartford_accounts')
            .insert({
                username,
                name: name || username,
                password_hash,
                is_owner: false
            })
            .select()
            .single();

        if (error) throw error;

        
        const token = jwt.sign(
            { 
                id: data.id, 
                username: data.username,
                is_owner: data.is_owner 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: data.id,
                username: data.username,
                name: data.name,
                avatar_url: data.avatar_url,
                is_owner: data.is_owner
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});


app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        
        const { data: user, error } = await supabase
            .from('smartford_accounts')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                is_owner: user.is_owner 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                avatar_url: user.avatar_url,
                is_owner: user.is_owner
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});


app.get('/api/v1/auth/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { data: user, error } = await supabase
            .from('smartford_accounts')
            .select('id, username, name, avatar_url, is_owner, created_at')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});


app.put('/api/v1/auth/profile', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { name, avatar_url } = req.body;

        const { data, error } = await supabase
            .from('smartford_accounts')
            .update({ name, avatar_url })
            .eq('id', decoded.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            user: {
                id: data.id,
                username: data.username,
                name: data.name,
                avatar_url: data.avatar_url,
                is_owner: data.is_owner
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/api/v1/auth/avatar', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        
        const { data: user, error: userError } = await supabase
            .from('smartford_accounts')
            .select('id, username')
            .eq('id', decoded.id)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image data required' });
        }

        
        const base64Data = image.split(',')[1];
        if (!base64Data) {
            return res.status(400).json({ error: 'Invalid image data' });
        }

        
        const mimeType = image.match(/data:image\/(\w+);base64/)?.[1] || 'png';
        const filePath = `avatars/${user.id}/avatar.${mimeType}`;

        
        const buffer = Buffer.from(base64Data, 'base64');

        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('smartford')
            .upload(filePath, buffer, {
                contentType: `image/${mimeType}`,
                upsert: true 
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload avatar' });
        }

        
        const { data: urlData } = supabase
            .storage
            .from('smartford')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        
        const { data, error } = await supabase
            .from('smartford_accounts')
            .update({ avatar_url: avatarUrl })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            user: {
                id: data.id,
                username: data.username,
                name: data.name,
                avatar_url: data.avatar_url,
                is_owner: data.is_owner
            }
        });
    } catch (error) {
        console.error('Avatar update error:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

app.post('/api/v1/news/create', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        
        const { data: user, error: userError } = await supabase
            .from('smartford_accounts')
            .select('id, is_owner, name')
            .eq('id', decoded.id)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.is_owner) {
            return res.status(403).json({ error: 'Access denied. Owner only.' });
        }

        const { name, date, text, image } = req.body;

        if (!name || !date || !text) {
            return res.status(400).json({ error: 'Name, date and text required' });
        }

        
        const { data: news, error: newsError } = await supabase
            .from('smartford_news')
            .insert({
                name,
                date,
                text,
                author: user.name
            })
            .select()
            .single();

        if (newsError) throw newsError;

        
        if (image) {
            try {
                
                const base64Data = image.split(',')[1];
                if (!base64Data) {
                    throw new Error('Invalid image data');
                }

                
                const buffer = Buffer.from(base64Data, 'base64');

                
                const pngBuffer = await sharp(buffer)
                    .png({ compressionLevel: 8 })
                    .toBuffer();

                
                const filePath = `news/${news.id}/${news.id}.png`;

                
                const { error: uploadError } = await supabase
                    .storage
                    .from('smartford')
                    .upload(filePath, pngBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    
                    await supabase.from('smartford_news').delete().eq('id', news.id);
                    return res.status(500).json({ error: 'Failed to upload cover image' });
                }

                
                const { data: urlData } = supabase
                    .storage
                    .from('smartford')
                    .getPublicUrl(filePath);

                
                

            } catch (imgError) {
                console.error('Image processing error:', imgError);
                
                await supabase.from('smartford_news').delete().eq('id', news.id);
                return res.status(500).json({ error: 'Failed to process image' });
            }
        }

        res.status(201).json({
            message: 'News created successfully',
            news: {
                ...news,
                preview_url: `/news/${news.id}/${news.id}.png`
            }
        });

    } catch (error) {
        console.error('News creation error:', error);
        res.status(500).json({ error: 'Failed to create news' });
    }
});

app.put('/api/v1/news/update/:id', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        
        const { data: user, error: userError } = await supabase
            .from('smartford_accounts')
            .select('is_owner')
            .eq('id', decoded.id)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.is_owner) {
            return res.status(403).json({ error: 'Access denied. Owner only.' });
        }

        const idParam = req.params.id as string | undefined;
        if (!idParam) {
            return res.status(400).json({ error: 'News ID required' });
        }

        const newsId = parseInt(idParam, 10);
        if (isNaN(newsId)) {
            return res.status(400).json({ error: 'Invalid news ID' });
        }

        const { name, date, text, author } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (date) updateData.date = date;
        if (text) updateData.text = text;
        if (author) updateData.author = author;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabase
            .from('smartford_news')
            .update(updateData)
            .eq('id', newsId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({
            message: 'News updated successfully',
            news: data
        });
    } catch (error) {
        console.error('News update error:', error);
        res.status(500).json({ error: 'Failed to update news' });
    }
});


app.delete('/api/v1/news/delete/:id', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        
        const { data: user, error: userError } = await supabase
            .from('smartford_accounts')
            .select('is_owner')
            .eq('id', decoded.id)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.is_owner) {
            return res.status(403).json({ error: 'Access denied. Owner only.' });
        }

        const idParam = req.params.id as string | undefined;
        if (!idParam) {
            return res.status(400).json({ error: 'News ID required' });
        }

        const newsId = parseInt(idParam, 10);
        if (isNaN(newsId)) {
            return res.status(400).json({ error: 'Invalid news ID' });
        }

        const { data, error } = await supabase
            .from('smartford_news')
            .delete()
            .eq('id', newsId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({
            message: 'News deleted successfully',
            news: data
        });
    } catch (error) {
        console.error('News delete error:', error);
        res.status(500).json({ error: 'Failed to delete news' });
    }
});


app.get('/api/v1/files/get', async (req: Request, res: Response) => {
    try {
        const count = req.query.count as string;
        const placeholder = req.query.placeholder === "true";
        const countNum = count ? parseInt(count, 10) : null;

        const ICON_OLD = "https://smartford.vercel.app/icons/smosold.png";
        const ICON_NEW = "https://smartford.vercel.app/icons/smosnew.png";

        if (placeholder) {
            const pCount = countNum || 5;
            const placeholders = Array.from({ length: pCount }, (_, i) => ({
                version: "0.0",
                name: `Smartford OS Placeholder ${i + 1}`,
                url: "#",
                icon: i % 2 === 0 ? ICON_OLD : ICON_NEW
            }));
            return res.status(200).json(placeholders);
        }

        const manifestResponse = await fetch("https://smartford.vercel.app/download/manifest.json");
        const versions: any[] = await manifestResponse.json();

        let result = versions.map(item => {
            const name = item.isBeta 
                ? `Smartford OS Beta ${item.version}` 
                : `Smartford OS ${item.version}`;
            
            const icon = item.version === "2.0" ? ICON_NEW : ICON_OLD;

            return {
                version: item.version,
                name: name,
                url: `https://smartford.vercel.app/download/${item.fileName}`,
                icon
            };
        });

        if (countNum) {
            result = result.slice(-countNum);
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("FILES GET ERROR:", err);
        res.status(500).json({ error: "Failed to list versions" });
    }
});

app.get('/api/v1/news/get', async (req: Request, res: Response) => {
    try {
        const countParam = req.query.count as string | undefined;
        const count = Math.min(parseInt(countParam || '8', 10) || 8, 20);
        
        const sortBy = (req.query.sort_by as string | undefined) || 'oldest';
        const isLocalHost = req.query.is_it_local_host_server === 'true';

        let query = supabase
            .from('smartford_news')
            .select('*')
            .limit(count);

        if (sortBy === 'newest') {
            query = query.order('date', { ascending: false });
        } else {
            query = query.order('date', { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedData = data.map((item) => ({
            id: item.id,
            title: item.name,
            author: item.author,
            description: item.text,
            date: item.date,
            preview_url: `${supabaseUrl}/storage/v1/object/public/smartford/news/${item.id}/${item.id}.png`
        }));

        res.json({
            count: formattedData.length,
            data: formattedData
        });
    } catch (error) {
        console.error('News fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/api/v1/news/get/:id', async (req: Request, res: Response) => {
    try {
        const idParam = req.params.id as string | undefined;
        if (!idParam) {
            return res.status(400).json({ 
                status: 400, 
                message: 'ID не указан' 
            });
        }
        
        const newsId = parseInt(idParam, 10);
        if (isNaN(newsId)) {
            return res.status(400).json({ 
                status: 400, 
                message: 'Некорректный ID' 
            });
        }

        const isLocalHost = req.query.is_it_local_host_server === 'true';

        const { data, error } = await supabase
            .from('smartford_news')
            .select('*')
            .eq('id', newsId)
            .single();

        if (error || !data) {
            return res.status(404).json({ 
                status: 404, 
                message: `Новость с ID ${newsId} не найдена` 
            });
        }

        const previewUrl = `${supabaseUrl}/storage/v1/object/public/smartford/news/${data.id}/${data.id}.png`;

        res.json({
            ...data,
            preview_url: previewUrl
        });
    } catch (error) {
        console.error('News detail error:', error);
        res.status(500).json({ error: 'Failed to fetch news details' });
    }
});

app.get('/api/v1/chat/ai/get', async (req: Request, res: Response) => {
    const apiKey = (req.query.api as string) || (req.query.key as string);
    const model = req.query.model as string;
    const systemPrompt = (req.query.system_prompt as string) || "";
    const userPrompt = req.query.prompt as string;
    const temperature = (req.query.temp as string) || "0.7";
    const maxTokens = req.query.tokens as string;

    console.log("AI Request received:", { model, hasKey: !!apiKey, hasPrompt: !!userPrompt });

    if (!apiKey || !model || !userPrompt) {
        return res.status(400).send(`Error: Missing parameters. Key: ${!!apiKey}, Model: ${!!model}, Prompt: ${!!userPrompt}`);
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: `System: ${systemPrompt}\n\n${userPrompt}` }
                ],
                temperature: parseFloat(temperature),
                max_tokens: maxTokens ? parseInt(maxTokens) : undefined
            })
        });

        const data = await response.json() as any;
        
        if (data.choices && data.choices[0]) {
            res.status(200).send(data.choices[0].message.content);
        } else {
            res.status(500).send(data.error?.message || "OpenRouter Error");
        }
    } catch (error: any) {
        res.status(500).send("Server Error: " + error.message);
    }
});

app.get('/api/v1/wallpapers/get', (req: Request, res: Response) => {
    const wallpapers = [
        {
            id: 1,
            title: "Стандартные",
            url: "https://smartford.vercel.app/wallpapers/default/img1.png",
            blur_url: "https://smartford.vercel.app/wallpapers/default/img2.png",
            preview_url: "https://smartford.vercel.app/api/v1/wallpapers/compress?size=144&wallpaper=default"
        },
        {
            id: 2,
            title: "Зима",
            url: "https://smartford.vercel.app/wallpapers/winter/img1.png",
            blur_url: "https://smartford.vercel.app/wallpapers/winter/img2.png",
            preview_url: "https://smartford.vercel.app/api/v1/wallpapers/compress?size=144&wallpaper=winter"
        },
        {
            id: 3,
            title: "Классические (modern)",
            url: "https://smartford.vercel.app/wallpapers/classic/img1.png",
            blur_url: "https://smartford.vercel.app/wallpapers/classic/img2.png",
            preview_url: "https://smartford.vercel.app/api/v1/wallpapers/compress?size=144&wallpaper=classic"
        }
    ];

    const count = req.query.count ? parseInt(req.query.count as string, 10) : wallpapers.length;
    const countNum = isNaN(count) ? wallpapers.length : count;

    res.status(200).json({
        count: Math.min(countNum, wallpapers.length),
        data: wallpapers.slice(0, countNum)
    });
});

app.get('/api/v1/wallpapers/compress', async (req: Request, res: Response) => {
    try {
        const size = (req.query.size as string) || "144";
        const wallpaper = req.query.wallpaper as string;

        if (!wallpaper || !WALLPAPERS[wallpaper]) {
            return res.status(400).json({ error: "Invalid wallpaper" });
        }

        const width = Math.min(parseInt(size, 10), 512);
        if (isNaN(width) || width <= 0) {
            return res.status(400).json({ error: "Invalid size" });
        }

        const response = await fetch(WALLPAPERS[wallpaper]);
        if (!response.ok) {
            throw new Error("Failed to fetch image");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const output = await sharp(buffer)
            .resize(width)
            .png({ compressionLevel: 8 })
            .toBuffer();

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.status(200).send(output);
    } catch (err) {
        console.error("COMPRESS ERROR:", err);
        res.status(500).json({ error: "Image compression failed" });
    }
});

app.get('/api/v1/status', (req: Request, res: Response) => {
    res.status(200).json({ status: "online", version: "1.0.0", timestamp: new Date().toISOString() });
});
app.get('/api/v1/docs', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smartford API Docs</title>
    <style>
        body { font-family: monospace; max-width: 900px; margin: 40px auto; padding: 0 20px; }
        h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { margin-top: 30px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #000; }
        .method { font-weight: bold; display: inline-block; min-width: 60px; }
        .get { color: #2b8cbe; }
        .post { color: #2e9b2e; }
        .put { color: #d4a017; }
        .delete { color: #c0392b; }
        .path { font-weight: bold; }
        .desc { margin: 10px 0 5px 0; }
        .code { background: #eee; padding: 2px 6px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .note { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Smartford API v1</h1>
    <p>Базовый URL: <code>/api/v1</code></p>

    <h2>Аутентификация</h2>
    <p>Большинство эндпойнтов требуют JWT токен в заголовке: <code>Authorization: Bearer &lt;token&gt;</code></p>

    <div class="endpoint">
        <div><span class="method post">POST</span> <span class="path">/auth/register</span></div>
        <div class="desc">Регистрация нового пользователя</div>
        <div><strong>Body:</strong></div>
        <pre>{
    "username": "user123",
    "password": "pass123",
    "name": "Иван"
}</pre>
    </div>

    <div class="endpoint">
        <div><span class="method post">POST</span> <span class="path">/auth/login</span></div>
        <div class="desc">Вход в систему</div>
        <div><strong>Body:</strong></div>
        <pre>{
    "username": "user123",
    "password": "pass123"
}</pre>
        <div><strong>Ответ:</strong> возвращает <code>token</code> и данные пользователя</div>
    </div>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/auth/me</span></div>
        <div class="desc">Получить данные текущего пользователя (требуется авторизация)</div>
    </div>

    <div class="endpoint">
        <div><span class="method put">PUT</span> <span class="path">/auth/profile</span></div>
        <div class="desc">Обновить профиль (требуется авторизация)</div>
        <div><strong>Body:</strong></div>
        <pre>{
    "name": "Новое имя",
    "avatar_url": "https://..."
}</pre>
    </div>

    <div class="endpoint">
        <div><span class="method post">POST</span> <span class="path">/auth/avatar</span></div>
        <div class="desc">Загрузить аватар (требуется авторизация)</div>
        <div><strong>Body:</strong></div>
        <pre>{
    "image": "data:image/png;base64,...."
}</pre>
    </div>

    <h2>Новости</h2>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/news/get</span></div>
        <div class="desc">Получить список новостей</div>
        <div><strong>Параметры (query):</strong></div>
        <ul>
            <li><code>count</code> - количество (по умолчанию 8, максимум 20)</li>
            <li><code>sort_by</code> - <code>newest</code> или <code>oldest</code> (по умолчанию oldest)</li>
        </ul>
    </div>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/news/get/:id</span></div>
        <div class="desc">Получить новость по ID</div>
    </div>

    <div class="endpoint">
        <div><span class="method post">POST</span> <span class="path">/news/create</span></div>
        <div class="desc">Создать новость (только владелец)</div>
        <div><strong>Body:</strong></div>
        <pre>{
    "name": "Заголовок",
    "date": "2024-01-01",
    "text": "Текст новости",
    "image": "data:image/png;base64,...."
}</pre>
    </div>

    <div class="endpoint">
        <div><span class="method put">PUT</span> <span class="path">/news/update/:id</span></div>
        <div class="desc">Обновить новость (только владелец)</div>
    </div>

    <div class="endpoint">
        <div><span class="method delete">DELETE</span> <span class="path">/news/delete/:id</span></div>
        <div class="desc">Удалить новость (только владелец)</div>
    </div>

    <h2>Файлы</h2>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/files/get</span></div>
        <div class="desc">Получить список версий Smartford OS</div>
        <div><strong>Параметры (query):</strong></div>
        <ul>
            <li><code>count</code> - количество версий</li>
            <li><code>placeholder=true</code> - вернуть заглушки вместо реальных данных</li>
        </ul>
    </div>

    <h2>Обои</h2>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/wallpapers/get</span></div>
        <div class="desc">Получить список обоев</div>
        <div><strong>Параметры (query):</strong></div>
        <ul>
            <li><code>count</code> - количество</li>
        </ul>
    </div>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/wallpapers/compress</span></div>
        <div class="desc">Получить сжатое изображение обоев</div>
        <div><strong>Параметры (query):</strong></div>
        <ul>
            <li><code>wallpaper</code> - <code>default</code>, <code>winter</code> или <code>classic</code></li>
            <li><code>size</code> - размер в пикселях (по умолчанию 144, максимум 512)</li>
        </ul>
    </div>

    <h2>AI Чат</h2>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/chat/ai/get</span></div>
        <div class="desc">Запрос к AI через OpenRouter (является PROXY)</div>
        <div><strong>Параметры (query):</strong></div>
        <ul>
            <li><code>api</code> или <code>key</code> - API ключ OpenRouter (обязательно)</li>
            <li><code>model</code> - модель (обязательно)</li>
            <li><code>prompt</code> - запрос пользователя (обязательно)</li>
            <li><code>system_prompt</code> - системный промпт</li>
            <li><code>temp</code> - температура (по умолчанию 0.7)</li>
            <li><code>tokens</code> - максимальное количество токенов</li>
        </ul>
    </div>

    <h2>Системные</h2>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/status</span></div>
        <div class="desc">Проверка статуса сервера</div>
    </div>

    <div class="endpoint">
        <div><span class="method get">GET</span> <span class="path">/version/latest</span></div>
        <div class="desc">Получить последнюю версию Smartford OS</div>
    </div>

    <div class="note">
        <strong>Примечание:</strong> Все эндпойнты с пометкой "только владелец" требуют аккаунт с правами владельца (is_owner = true).
    </div>

    <hr>
    <p style="color: #666; font-size: 14px;">Smartford API v1.0.0 | 2024-2026 Smartford Company</p>
</body>
</html>
    `);
});
app.get('/api/v1/version/latest', (req: Request, res: Response) => {
    res.status(200).json({
        version: "2.2",
        name: "SmartFord OS 2: Redesign",
        updatedAt: new Date().toISOString()
    });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Запрашиваемая функция или путь не найдены",
        path: req.originalUrl
    });
});

export default app;