"""
Management command to seed the database with default admin and conductor accounts.
Run with: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.models import SystemAdmin, Conductor


class Command(BaseCommand):
    help = 'Seeds default admin account and conductor accounts with hashed passwords/PINs.'

    def handle(self, *args, **options):
        # ── Seed Admin ──
        if not SystemAdmin.objects.filter(username='admin').exists():
            SystemAdmin.objects.create(
                id='admin_1',
                username='admin',
                password=make_password('password@123'),
                name='System Admin',
            )
            self.stdout.write(self.style.SUCCESS('[OK] Default admin created: admin / password@123'))
        else:
            self.stdout.write(self.style.WARNING('[SKIP] Admin "admin" already exists - skipped.'))

        # ── Seed Conductors ──
        conductors = [
            {'id': 'COND001', 'name': 'Ravi Kumar',  'pin': '1234', 'route': 'Route 5C'},
            {'id': 'COND002', 'name': 'Suresh Babu', 'pin': '5678', 'route': 'Route 12A'},
            {'id': 'COND003', 'name': 'Priya Devi',  'pin': '9999', 'route': 'Route 8B'},
        ]

        created = 0
        for c in conductors:
            if not Conductor.objects.filter(id=c['id']).exists():
                Conductor.objects.create(
                    id=c['id'],
                    name=c['name'],
                    pin=make_password(c['pin']),
                    route=c['route'],
                    is_active=True,
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(
                    f"  [OK] Conductor {c['id']} ({c['name']}) - PIN: {c['pin']} - {c['route']}"
                ))
            else:
                self.stdout.write(self.style.WARNING(f"  [SKIP] Conductor {c['id']} already exists - skipped."))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Seeding complete. {created} new conductor(s) created.'))
        self.stdout.write('')
        self.stdout.write('Default credentials:')
        self.stdout.write('  Admin    -- admin / password@123')
        self.stdout.write('  COND001  -- PIN: 1234  (Ravi Kumar, Route 5C)')
        self.stdout.write('  COND002  -- PIN: 5678  (Suresh Babu, Route 12A)')
        self.stdout.write('  COND003  -- PIN: 9999  (Priya Devi, Route 8B)')
