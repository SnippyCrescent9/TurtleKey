import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div>
            {/* Shared Navbar */}
            <header>
                <h1>Welcome to TurtleKey!</h1>
                <nav>
                    <div style={{ display: 'flex', gap: '10px'}}>
                        <Link to='/'>Home</Link>
                        <Link to='/about'>About</Link>
                        <Link to='/passwordRater'>Rate my password</Link>
                        <Link to='/generatePw'>Generate password</Link>
                    </div>
                </nav>
            </header>

            {/* Child components will render here */}
            <main>
                <Outlet />
            </main>
        </div>
    )
}

export default Layout