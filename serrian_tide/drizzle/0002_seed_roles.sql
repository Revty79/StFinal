INSERT INTO roles (code, name, description) VALUES
('admin',            'Admin',            'Full platform control.'),
('privileged',       'Privileged User',  'Trusted user with nearly admin-level access.'),
('free',             'Free Account',     'Base account with minimal limits.'),
('world_builder',    'World Builder',    'Tier 1: create limited worlds, no marketplace selling.'),
('world_developer',  'World Developer',  'Tier 2: more worlds and can sell content.'),
('universe_creator', 'Universe Creator', 'Tier 3: most worlds, selling, and higher limits.')
ON CONFLICT (code) DO NOTHING;
